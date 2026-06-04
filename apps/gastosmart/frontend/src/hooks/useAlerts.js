import { useState, useEffect } from 'react'
import React from 'react'
import { apiService } from '../services/apiService'

export const useAlerts = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [thresholdConfig, setThresholdConfig] = useState(null)
  const [alertHistory, setAlertHistory] = useState([])
  const [activeTab, setActiveTab] = useState('config') // 'config' or 'history'

  // Load threshold configuration
  const loadThresholdConfig = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const config = await apiService.alerts.getThresholdConfig()
      setThresholdConfig(config)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load alert history
  const loadAlertHistory = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const history = await apiService.alerts.getHistory(0, 50)
      setAlertHistory(history)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save threshold configuration
  const saveThresholdConfig = async (configData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const saved = await apiService.alerts.saveThresholdConfig(configData)
      setThresholdConfig(saved)
      setSuccess('Configuración de alertas actualizada correctamente')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
      return saved
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Note: Data loading is handled by the component when modal opens

  return {
    loading,
    saving,
    error,
    success,
    thresholdConfig,
    alertHistory,
    activeTab,
    setActiveTab,
    loadThresholdConfig,
    loadAlertHistory,
    saveThresholdConfig,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null)
  }
}

