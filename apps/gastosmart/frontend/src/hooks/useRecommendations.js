import { useState, useEffect } from 'react'
import React from 'react'
import { apiService } from '../services/apiService'

export const useRecommendations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)

  // Load recommendations
  const loadRecommendations = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.recommendations.getRecommendations()
      setRecommendations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    recommendations,
    loadRecommendations,
    clearError: () => setError(null)
  }
}

