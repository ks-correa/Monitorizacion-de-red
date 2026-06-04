import React, { useState } from 'react'
import { useRecommendations } from '../hooks/useRecommendations'
import { formatCurrency } from '../config/config'
import '../styles/RecommendationsModal.css'

const RecommendationsModal = ({ isOpen, onClose }) => {
  const {
    loading,
    error,
    recommendations,
    loadRecommendations,
    clearError
  } = useRecommendations()

  // Track if data has been loaded to prevent multiple loads
  const dataLoadedRef = React.useRef(false)

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && !dataLoadedRef.current) {
      loadRecommendations()
      dataLoadedRef.current = true
    } else if (!isOpen) {
      clearError()
      dataLoadedRef.current = false
    }
  }, [isOpen, loadRecommendations, clearError])

  if (!isOpen) return null

  return (
    <div className="recommendations-modal-overlay" onClick={onClose}>
      <div className="recommendations-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recommendations-modal-header">
          <h2>Recomendaciones Financieras</h2>
          <button className="recommendations-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="recommendations-modal-content">
          {loading ? (
            <div className="recommendations-loading">Cargando recomendaciones...</div>
          ) : error ? (
            <div className="recommendations-error">{error}</div>
          ) : recommendations ? (
            <div className="recommendations-list">
              {/* Recomendación personalizada del mes */}
              {recommendations.monthly_recommendation ? (
                <div className="recommendation-item monthly">
                  <div className="recommendation-header">
                    <div className="recommendation-icon monthly-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Recomendación del Mes</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">{recommendations.monthly_recommendation.message}</div>
                  {recommendations.monthly_recommendation.type === 'comparison' && (
                    <div className="recommendation-details">
                      <div className="recommendation-detail">
                        <span className="recommendation-detail-label">Mes actual:</span>
                        <span className="recommendation-detail-value">{formatCurrency(recommendations.monthly_recommendation.current_month_expenses)}</span>
                      </div>
                      {recommendations.monthly_recommendation.previous_month_expenses && (
                        <div className="recommendation-detail">
                          <span className="recommendation-detail-label">Mes anterior:</span>
                          <span className="recommendation-detail-value">{formatCurrency(recommendations.monthly_recommendation.previous_month_expenses)}</span>
                        </div>
                      )}
                      {recommendations.monthly_recommendation.variation_percentage !== null && (
                        <div className="recommendation-detail">
                          <span className="recommendation-detail-label">Variación:</span>
                          <span className="recommendation-detail-value">{recommendations.monthly_recommendation.variation_percentage > 0 ? '+' : ''}{recommendations.monthly_recommendation.variation_percentage.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  {recommendations.monthly_recommendation.budget_percentage && (
                    <div className="recommendation-details">
                      <div className="recommendation-detail">
                        <span className="recommendation-detail-label">Presupuesto utilizado:</span>
                        <span className="recommendation-detail-value">{recommendations.monthly_recommendation.budget_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recommendation-item no-data monthly">
                  <div className="recommendation-header">
                    <div className="recommendation-icon monthly-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Recomendación del Mes</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">No hay datos suficientes para generar una recomendación del mes. Registra ingresos y gastos para recibir recomendaciones personalizadas.</div>
                </div>
              )}

              {/* Recomendación por categoría */}
              {recommendations.category_recommendation ? (
                <div className="recommendation-item category">
                  <div className="recommendation-header">
                    <div className="recommendation-icon category-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Categoría con Mayor Gasto</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">{recommendations.category_recommendation.message}</div>
                  <div className="recommendation-details">
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Categoría:</span>
                      <span className="recommendation-detail-value">{recommendations.category_recommendation.category}</span>
                    </div>
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Monto gastado:</span>
                      <span className="recommendation-detail-value">{formatCurrency(recommendations.category_recommendation.amount)}</span>
                    </div>
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Porcentaje del total:</span>
                      <span className="recommendation-detail-value">{recommendations.category_recommendation.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="recommendation-item no-data category">
                  <div className="recommendation-header">
                    <div className="recommendation-icon category-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Categoría con Mayor Gasto</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">No hay gastos registrados este mes. Registra tus gastos para recibir recomendaciones por categoría.</div>
                </div>
              )}

              {/* Recomendación sobre metas */}
              {recommendations.goal_recommendation ? (
                <div className="recommendation-item goal">
                  <div className="recommendation-header">
                    <div className="recommendation-icon goal-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Recomendación sobre Metas</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">{recommendations.goal_recommendation.message}</div>
                  <div className="recommendation-details">
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Meta:</span>
                      <span className="recommendation-detail-value">{recommendations.goal_recommendation.goal_name}</span>
                    </div>
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Progreso:</span>
                      <span className="recommendation-detail-value">{recommendations.goal_recommendation.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Monto actual:</span>
                      <span className="recommendation-detail-value">{formatCurrency(recommendations.goal_recommendation.current_amount)}</span>
                    </div>
                    <div className="recommendation-detail">
                      <span className="recommendation-detail-label">Monto objetivo:</span>
                      <span className="recommendation-detail-value">{formatCurrency(recommendations.goal_recommendation.target_amount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="recommendation-item no-data goal">
                  <div className="recommendation-header">
                    <div className="recommendation-icon goal-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">Recomendación sobre Metas</div>
                    </div>
                  </div>
                  <div className="recommendation-message-text">No tienes metas de ahorro activas. Crea una meta para recibir recomendaciones personalizadas sobre tu progreso.</div>
                </div>
              )}

              {/* Tip educativo del día */}
              {recommendations.educational_tip && (
                <div className="recommendation-item tip">
                  <div className="recommendation-header">
                    <div className="recommendation-icon tip-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <div className="recommendation-content">
                      <h3 className="recommendation-title">Tip del Día</h3>
                      <p className="recommendation-tip-title">{recommendations.educational_tip.title}</p>
                      <p className="recommendation-message-text">{recommendations.educational_tip.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="recommendations-empty">No se pudieron cargar las recomendaciones</div>
          )}
        </div>

        <div className="recommendations-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecommendationsModal

