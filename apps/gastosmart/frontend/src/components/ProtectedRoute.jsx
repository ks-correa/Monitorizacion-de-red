import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBudgetConfigured, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  
  if (!isBudgetConfigured && location.pathname !== '/initial-budget') {
    return <Navigate to="/initial-budget" replace />
  }

  
  if (location.pathname === '/initial-budget' && isBudgetConfigured) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
