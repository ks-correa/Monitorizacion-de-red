import React, { useState } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { formatCurrency } from '../config/config'
import '../styles/AlertsModal.css'

const AlertsModal = ({ isOpen, onClose }) => {
  const {
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
    clearError,
    clearSuccess
  } = useAlerts()

  const [thresholdType, setThresholdType] = useState('80')
  const [customPercentage, setCustomPercentage] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Initialize form when config loads
  React.useEffect(() => {
    if (thresholdConfig) {
      if (thresholdConfig.threshold_type === 'custom') {
        setThresholdType('custom')
        setCustomPercentage(thresholdConfig.custom_percentage?.toString() || '')
        setShowCustomInput(true)
      } else {
        setThresholdType(thresholdConfig.threshold_type)
        setCustomPercentage('')
        setShowCustomInput(false)
      }
    }
  }, [thresholdConfig])

  // Track if data has been loaded to prevent multiple loads
  const dataLoadedRef = React.useRef(false)

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && !dataLoadedRef.current) {
      loadThresholdConfig()
      loadAlertHistory()
      dataLoadedRef.current = true
    } else if (!isOpen) {
      clearError()
      clearSuccess()
      dataLoadedRef.current = false
    }
  }, [isOpen, loadThresholdConfig, loadAlertHistory, clearError, clearSuccess])

  const handleThresholdTypeChange = (e) => {
    const value = e.target.value
    setThresholdType(value)
    setShowCustomInput(value === 'custom')
    if (value !== 'custom') {
      setCustomPercentage('')
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    
    try {
      const configData = {
        threshold_type: thresholdType,
        custom_percentage: showCustomInput && customPercentage ? parseFloat(customPercentage) : null
      }

      // Validate custom percentage
      if (showCustomInput) {
        const percentage = parseFloat(customPercentage)
        if (isNaN(percentage) || percentage < 10 || percentage > 100) {
          alert('El porcentaje personalizado debe ser un número entre 10 y 100')
          return
        }
        configData.custom_percentage = percentage
      }

      await saveThresholdConfig(configData)
    } catch (err) {
      // Error is handled by the hook
      console.error('Error saving config:', err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${date.getDate()} de ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (!isOpen) return null

  return (
    <div className="alerts-modal-overlay" onClick={onClose}>
      <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alerts-modal-header">
          <h2>Configuración de Alertas</h2>
          <button className="alerts-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alerts-modal-tabs">
          <button
            className={`alerts-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuración
          </button>
          <button
            className={`alerts-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historial ({alertHistory.length})
          </button>
        </div>

        <div className="alerts-modal-content">
          {activeTab === 'config' ? (
            <div className="alerts-config">
              {success && (
                <div className="alerts-success">
                  {success}
                </div>
              )}
              {error && (
                <div className="alerts-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveConfig}>
                <div className="alerts-form-group">
                  <label>Umbral de alerta de sobre-gasto</label>
                  <p className="alerts-help-text">
                    Selecciona el porcentaje de tu presupuesto mensual al que quieres recibir una alerta.
                  </p>
                  
                  <div className="alerts-options">
                    <label className="alerts-radio-option">
                      <input
                        type="radio"
                        name="threshold"
                        value="80"
                        checked={thresholdType === '80'}
                        onChange={handleThresholdTypeChange}
                      />
                      <span>80%</span>
                    </label>
                    <label className="alerts-radio-option">
                      <input
                        type="radio"
                        name="threshold"
                        value="90"
                        checked={thresholdType === '90'}
                        onChange={handleThresholdTypeChange}
                      />
                      <span>90%</span>
                    </label>
                    <label className="alerts-radio-option">
                      <input
                        type="radio"
                        name="threshold"
                        value="100"
                        checked={thresholdType === '100'}
                        onChange={handleThresholdTypeChange}
                      />
                      <span>100%</span>
                    </label>
                    <label className="alerts-radio-option">
                      <input
                        type="radio"
                        name="threshold"
                        value="custom"
                        checked={thresholdType === 'custom'}
                        onChange={handleThresholdTypeChange}
                      />
                      <span>Otro porcentaje</span>
                    </label>
                  </div>

                  {showCustomInput && (
                    <div className="alerts-custom-input">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        step="0.1"
                        value={customPercentage}
                        onChange={(e) => setCustomPercentage(e.target.value)}
                        onDragStart={(e) => e.preventDefault()}
                        onDragEnd={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        placeholder="Ej: 75"
                        required
                      />
                      <span>%</span>
                    </div>
                  )}
                </div>

                <div className="alerts-form-actions">
                  <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="alerts-history">
              {loading ? (
                <div className="alerts-loading">Cargando historial...</div>
              ) : alertHistory.length === 0 ? (
                <div className="alerts-empty">
                  <div className="alerts-empty-icon">📭</div>
                  <p className="alerts-empty-title">No hay alertas registradas</p>
                  <p className="alerts-empty-subtitle">
                    Aún no se ha enviado ningún correo de alerta. Las alertas aparecerán aquí cuando alcances el umbral configurado de sobre-gasto.
                  </p>
                </div>
              ) : (
                <div className="alerts-history-list">
                  {alertHistory.map((alert) => (
                    <div key={alert.id} className="alerts-history-item">
                      <div className="alerts-history-header">
                        <div className="alerts-history-info">
                          <div className="alerts-history-title">
                            Alerta de sobre-gasto - {alert.threshold_percentage}%
                          </div>
                          <div className="alerts-history-date">
                            {formatDate(alert.sent_at)}
                          </div>
                        </div>
                      </div>
                      <div className="alerts-history-details">
                        <div className="alerts-history-detail">
                          <span className="alerts-detail-label">Periodo:</span>
                          <span className="alerts-detail-value">
                            {new Date(alert.period_year, alert.period_month - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="alerts-history-detail">
                          <span className="alerts-detail-label">Monto gastado:</span>
                          <span className="alerts-detail-value">{formatCurrency(alert.amount_spent)}</span>
                        </div>
                        <div className="alerts-history-detail">
                          <span className="alerts-detail-label">Presupuesto:</span>
                          <span className="alerts-detail-value">{formatCurrency(alert.budget_amount)}</span>
                        </div>
                        <div className="alerts-history-detail">
                          <span className="alerts-detail-label">Porcentaje utilizado:</span>
                          <span className="alerts-detail-value">
                            {((alert.amount_spent / alert.budget_amount) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {alert.email_sent && (
                        <div className="alerts-history-status">
                          ✓ Correo enviado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertsModal

