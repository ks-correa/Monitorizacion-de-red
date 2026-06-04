import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        
        const existingUser = authService.getCurrentUser()
        if (existingUser) {
          setUser(existingUser)
          console.log('Usuario encontrado en sesión:', existingUser)
        } else {
          console.log('No hay usuario en sesión')
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExistingSession()
    
    // Escuchar eventos personalizados para actualizar el usuario cuando se guarda el token
    const handleAuthUpdate = () => {
      const updatedUser = authService.getCurrentUser()
      if (updatedUser) {
        setUser(updatedUser)
        console.log('Usuario actualizado desde evento authUpdate:', updatedUser)
      }
    }
    
    // Escuchar el evento personalizado 'authUpdate' que se dispara cuando se guarda el token
    window.addEventListener('authUpdate', handleAuthUpdate)
    
    // También escuchar cambios en sessionStorage (funciona entre pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        setTimeout(() => {
          const updatedUser = authService.getCurrentUser()
          if (updatedUser) {
            setUser(updatedUser)
          } else if (e.key === 'user' && e.newValue === null) {
            setUser(null)
          }
        }, 50)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('authUpdate', handleAuthUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const userData = await authService.login(email, password)
      setUser(userData)
      return userData
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      console.log('AuthContext.register - iniciando registro') // Debug
      const newUser = await authService.register(userData)
      console.log('AuthContext.register - registro exitoso:', newUser) // Debug
      setLoading(false)
      return newUser
    } catch (error) {
      console.log('AuthContext.register - error capturado:', error) // Debug
      setError(error.message)
      setLoading(false)
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setError(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    authService.updateUserData(userData)
  }

  const updateUserBudget = async (initialBudget, budgetPeriod) => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await authService.updateUserBudget(initialBudget, budgetPeriod)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmCode = async (email, code, purpose) => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.verifyCode(email, code, purpose)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasBudgetConfigured = (userData = user) => {
    if (!userData) return false
    
    
    if (userData.budget_configured !== undefined) {
      return userData.budget_configured === true
    }
    
    
    const isDefaultBudget = userData.initial_budget === 1000000
    return userData.initial_budget && 
           userData.budget_period && 
           userData.initial_budget > 0 && 
           userData.budget_period.trim() !== '' &&
           !isDefaultBudget
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    updateUserBudget,
    confirmCode,
    hasBudgetConfigured,
    isAuthenticated: !!user,
    isBudgetConfigured: hasBudgetConfigured()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
