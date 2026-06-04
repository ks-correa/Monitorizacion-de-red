import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import config from '../config/config'

/**
 * Hook personalizado para manejar toda la lógica de Login
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  
  // Estados para manejo de intentos fallidos y bloqueo
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockUntil, setBlockUntil] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Flags
  const hasActiveError = useRef(false)
  const isSubmitting = useRef(false)
  const hasInitialized = useRef(false)
  
  const navigate = useNavigate()
  const location = useLocation()

  // ====== UTIL: login seguro sin interceptores ======
  const safeAuthLogin = async (email, password) => {
    const api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      // IMPORTANTÍSIMO: no copiar interceptores globales
      // No agregamos api.interceptors.request/response aquí.
    })

    // Usar la ruta correcta del backend
    const res = await api.post('/users/login', { email, password })
    return res.data
  }

  // Mostrar mensaje de sesión expirada si viene del state
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message)
      const timer = setTimeout(() => {
        setInfo('')
        window.history.replaceState({}, document.title)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [location])

  // Cargar solo el estado de bloqueo desde localStorage
  useEffect(() => {
    if (hasInitialized.current) return
    
    hasInitialized.current = true
    const savedBlockUntil = localStorage.getItem('loginBlockUntil')
    
    if (!hasActiveError.current) {
      localStorage.removeItem('loginFailedAttempts')
      setFailedAttempts(0)
    }
    
    if (savedBlockUntil) {
      const blockTime = new Date(savedBlockUntil).getTime()
      const now = Date.now()
      
      if (now < blockTime) {
        setIsBlocked(true)
        setBlockUntil(blockTime)
        setTimeLeft(Math.ceil((blockTime - now) / 1000))
      } else {
        localStorage.removeItem('loginBlockUntil')
        setIsBlocked(false)
        setBlockUntil(null)
      }
    } else {
      setIsBlocked(false)
      setBlockUntil(null)
    }
  }, [])

  // Timer de bloqueo
  useEffect(() => {
    if (isBlocked && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsBlocked(false)
            setBlockUntil(null)
            localStorage.removeItem('loginFailedAttempts')
            localStorage.removeItem('loginBlockUntil')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isBlocked, timeLeft])

  // Protección de errores
  const lastErrorRef = useRef(null)
  const lastFieldErrorsRef = useRef({})
  const isSettingErrorsRef = useRef(false)
  
  useEffect(() => {
    if (isSettingErrorsRef.current) return
    
    if (hasActiveError.current) {
      if (error) lastErrorRef.current = error
      if (Object.keys(fieldErrors).length > 0) {
        lastFieldErrorsRef.current = fieldErrors
      }
      
      if (Object.keys(fieldErrors).length === 0 && Object.keys(lastFieldErrorsRef.current).length > 0) {
        setFieldErrors(lastFieldErrorsRef.current)
      }
      
      if (!error && lastErrorRef.current) {
        setError(lastErrorRef.current)
      }
    }
  }, [error, fieldErrors])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (error) {
      setError('')
      hasActiveError.current = false
    }
    setInfo('')
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    const domErr = document.getElementById('login-error')
    if (domErr) domErr.remove()
  }

  const validateForm = () => {
    const errs = {}
    
    if (!formData.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Por favor, ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)'
      }
    }
    
    if (!formData.password) {
      errs.password = 'La contraseña es obligatoria'
    }
    
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) e.stopImmediatePropagation()
    }

    if (isSubmitting.current) return false

    isSubmitting.current = true

    if (isBlocked) {
      setError(`Cuenta bloqueada temporalmente. Intente nuevamente en ${formatTime(timeLeft)}`)
      isSubmitting.current = false
      return false
    }

    if (!validateForm()) {
      isSubmitting.current = false
      return false
    }

    let hasError = false
    const savedFormData = { ...formData }

    try {
      setLoading(true)

      // ====== LOGIN SIN INTERCEPTORES ======
      const responseData = await safeAuthLogin(formData.email, formData.password)
      
      // Guardar token y usuario en sessionStorage (igual que authService.login)
      const token = responseData.access_token
      const user = responseData.user
      
      sessionStorage.setItem('user', JSON.stringify(user))
      sessionStorage.setItem('token', token)
      
      // Disparar evento personalizado para actualizar AuthContext
      window.dispatchEvent(new Event('authUpdate'))
      
      // Limpiar cualquier dato antiguo de localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')

      // ÉXITO: limpiar estado de intentos/bloqueos
      localStorage.removeItem('loginFailedAttempts')
      localStorage.removeItem('loginBlockUntil')
      setFailedAttempts(0)
      setIsBlocked(false)

      // Expiración sesión (30 min)
      const sessionExpiry = Date.now() + 30 * 60 * 1000
      localStorage.setItem('sessionExpiry', String(sessionExpiry))
      
      // Guardar última actividad
      localStorage.setItem('lastActivity', Date.now().toString())

      // IMPORTANTE: Usar flushSync para asegurar que los estados se actualicen antes de navegar
      setLoading(false)
      isSubmitting.current = false
      
      // Redirección inteligente - usar replace: true para evitar problemas de navegación
      // Pequeño delay para asegurar que AuthContext se actualice
      if (!hasError) {
        setTimeout(() => {
          if (user.budget_configured === true || (user.initial_budget && user.initial_budget > 1000000)) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/initial-budget', { replace: true })
          }
        }, 200)
      }

      return true

    } catch (err) {
      hasError = true
      setLoading(false)

      let errorMessage = 'Error al iniciar sesión'
      let fieldErrs = {}
      let shouldCountAttempt = false

      const errorStatus = err.status || err.response?.status

      if (errorStatus === 401) {
        // Diferenciar contraseña incorrecta vs correo inexistente
        try {
          const apiInstance = axios.create({
            baseURL: config.apiBaseUrl,
            headers: { 'Content-Type': 'application/json' },
          })

          const token = sessionStorage.getItem('token') || localStorage.getItem('token')
          if (token) apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`

          const checkResponse = await apiInstance.get(`/users/email/${encodeURIComponent(formData.email)}`)

          if (checkResponse.data) {
            errorMessage = 'Correo o contraseña incorrectos'
            fieldErrs = { email: errorMessage }
            shouldCountAttempt = true
          } else {
            errorMessage = 'El correo que ingresó no se encuentra en la base de datos. Por favor, verifique su correo o cree una cuenta.'
            fieldErrs = { email: errorMessage }
            shouldCountAttempt = false
          }
        } catch (checkErr) {
          if (checkErr.response?.status === 404) {
            errorMessage = 'El correo que ingresó no se encuentra en la base de datos. Por favor, verifique su correo o cree una cuenta.'
            fieldErrs = { email: errorMessage }
            shouldCountAttempt = false
          } else {
            errorMessage = 'Correo o contraseña incorrectos'
            fieldErrs = { email: errorMessage }
            shouldCountAttempt = true
          }
        }
      } else if (errorStatus === 404) {
        errorMessage = 'El correo que ingresó no se encuentra en la base de datos. Por favor, verifique su correo o cree una cuenta.'
        fieldErrs = { email: errorMessage }
        shouldCountAttempt = false
      } else if (errorStatus === 403) {
        if (err.message?.includes('bloqueada') || err.response?.data?.detail?.includes('bloqueada') || err.response?.data?.detail?.includes('máximo de intentos')) {
          errorMessage = 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos'
          fieldErrs = { email: errorMessage }
          shouldCountAttempt = false
          
          const blockUntil = Date.now() + 15 * 60 * 1000
          setIsBlocked(true)
          setBlockUntil(blockUntil)
          setTimeLeft(15 * 60)
          localStorage.setItem('loginBlockUntil', String(blockUntil))
          localStorage.removeItem('loginFailedAttempts')
          setFailedAttempts(0)
        } else {
          errorMessage = 'Cuenta no verificada'
          fieldErrs = { email: 'Debes verificar tu cuenta primero' }
          shouldCountAttempt = false
        }
      } else if (errorStatus === 422) {
        const detail = err.response?.data?.detail
        if (Array.isArray(detail) && detail.length > 0) {
          const firstError = detail[0]
          errorMessage = firstError.msg || (typeof firstError === 'string' ? firstError : 'Error de validación en los datos ingresados')
          if (firstError.loc && Array.isArray(firstError.loc)) {
            const fieldName = firstError.loc[firstError.loc.length - 1]
            if (fieldName === 'email' || fieldName === 'password') fieldErrs[fieldName] = errorMessage
          }
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = 'Error de validación en los datos ingresados'
        }
        shouldCountAttempt = false
      } else if (errorStatus === 500) {
        errorMessage = 'Error interno del servidor. Por favor, intente más tarde'
        fieldErrs = {}
        shouldCountAttempt = false
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        if (Array.isArray(detail) && detail.length > 0) {
          errorMessage = typeof detail[0] === 'string' ? detail[0] : detail[0].msg || 'Error del servidor'
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = 'Error del servidor'
        }
        shouldCountAttempt = false
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Failed to fetch') || err.message?.includes('Network Error') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo'
        fieldErrs = {}
        shouldCountAttempt = false
      } else if (err.message) {
        errorMessage = err.message
        shouldCountAttempt = false
      }

      if (/network|conexión/i.test(errorMessage)) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo'
      }

      hasActiveError.current = true
      lastErrorRef.current = errorMessage
      lastFieldErrorsRef.current = fieldErrs

      if (!formData.email && !formData.password && savedFormData.email) {
        setFormData(savedFormData)
      }

      if (Object.keys(fieldErrs).length === 0 && errorMessage) {
        fieldErrs = { email: errorMessage }
      }

      let newFailedAttempts = failedAttempts
      if (shouldCountAttempt) {
        newFailedAttempts = failedAttempts + 1
        setFailedAttempts(newFailedAttempts)
        localStorage.setItem('loginFailedAttempts', String(newFailedAttempts))
      }

      isSettingErrorsRef.current = true
      flushSync(() => {
        setFieldErrors(fieldErrs)
        setError(errorMessage)
        setFailedAttempts(newFailedAttempts)
        if (!formData.email && !formData.password && savedFormData.email) {
          setFormData(savedFormData)
        }
      })
      setTimeout(() => { isSettingErrorsRef.current = false }, 200)

      setTimeout(() => {
        if (hasActiveError.current) {
          setFieldErrors(prev => {
            if (Object.keys(prev).length === 0 && Object.keys(lastFieldErrorsRef.current).length > 0) {
              return { ...lastFieldErrorsRef.current }
            }
            return prev
          })

          setError(prev => (!prev && lastErrorRef.current ? lastErrorRef.current : prev))

          setFailedAttempts(prev => (prev === 0 && newFailedAttempts > 0 ? newFailedAttempts : prev))
        }
      }, 100)

      // IMPORTANTÍSIMO: no navegamos ni recargamos aquí
      setTimeout(() => { isSubmitting.current = false }, 100)
      return false

    } finally {
      if (!hasError) isSubmitting.current = false
    }
  }

  return {
    formData,
    error,
    info,
    loading,
    showPassword,
    fieldErrors,
    failedAttempts,
    isBlocked,
    timeLeft,
    handleChange,
    handleSubmit,
    setShowPassword,
    formatTime
  }
}
