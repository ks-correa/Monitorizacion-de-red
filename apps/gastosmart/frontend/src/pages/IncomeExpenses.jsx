import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { CardSkeleton, ListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import AlertsModal from '../components/AlertsModal'
import RecommendationsModal from '../components/RecommendationsModal'
import { formatCurrency } from '../config/config'
import { useTransactions } from '../hooks/useTransactions'
import { apiService } from '../services/apiService'
import '../styles/IncomeExpenses.css'

const IncomeExpenses = () => {
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false)
  const [unviewedAlertsCount, setUnviewedAlertsCount] = useState(0)
  const [unviewedRecommendationsCount, setUnviewedRecommendationsCount] = useState(0)
  
  const {
    incomeTransactions,
    expenseTransactions,
    monthlySummary,
    loading,
    saving,
    error,
    showAddForm,
    editingTransaction,
    transactionType,
    amountValue,
    incomeCategories,
    expenseCategories,
    register,
    handleSubmit,
    errors,
    calculateCurrentBalance,
    calculateTotalExpenses,
    calculateTotalIncome,
    handleAmountChange,
    onSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    openAddForm
  } = useTransactions()

  // Cargar número de alertas no vistas
  useEffect(() => {
    const loadUnviewedAlerts = async () => {
      try {
        const count = await apiService.alerts.getUnviewedCount()
        setUnviewedAlertsCount(count)
      } catch (error) {
        console.error('Error cargando alertas no vistas:', error)
      }
    }
    
    loadUnviewedAlerts()
    // Recargar cada 30 segundos
    const interval = setInterval(loadUnviewedAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Cargar número de recomendaciones no vistas
  useEffect(() => {
    const loadUnviewedRecommendations = async () => {
      try {
        const count = await apiService.recommendations.getUnviewedCount()
        setUnviewedRecommendationsCount(count)
      } catch (error) {
        console.error('Error cargando recomendaciones no vistas:', error)
      }
    }
    
    loadUnviewedRecommendations()
    // Recargar cada 30 segundos
    const interval = setInterval(loadUnviewedRecommendations, 30000)
    return () => clearInterval(interval)
  }, [])

  // Recargar contadores cuando se cierran los modales
  useEffect(() => {
    if (!showAlertsModal) {
      const loadUnviewedAlerts = async () => {
        try {
          const count = await apiService.alerts.getUnviewedCount()
          setUnviewedAlertsCount(count)
        } catch (error) {
          console.error('Error cargando alertas no vistas:', error)
        }
      }
      loadUnviewedAlerts()
    }
  }, [showAlertsModal])

  useEffect(() => {
    if (!showRecommendationsModal) {
      const loadUnviewedRecommendations = async () => {
        try {
          const count = await apiService.recommendations.getUnviewedCount()
          setUnviewedRecommendationsCount(count)
        } catch (error) {
          console.error('Error cargando recomendaciones no vistas:', error)
        }
      }
      loadUnviewedRecommendations()
    }
  }, [showRecommendationsModal])


  if (loading) {
    return (
      <DashboardLayout hideBudget={true}>
        <div className="income-expenses-container">
          <div className="page-header">
            <h1>Ingresos/Gastos</h1>
          </div>
          <CardSkeleton />
          <div className="income-expense-grid">
            <ListSkeleton count={5} />
            <ListSkeleton count={5} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout hideBudget={true}>
      <div className="income-expenses-container">
        {/* Header */}
        <div className="page-header">
          <h1>Gestión de ingresos y gastos</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="icon-warning"></i>
            {error}
          </div>
        )}

        {/* Balance Card - Full Width */}
        <div className="balance-section">
          <div className="balance-card">
            <h3>Balance mensual Actual</h3>
            <div className="balance-content">
              <div className="balance-amount">
                {formatCurrency(calculateCurrentBalance())}
                <span className="balance-change positive">
                  <i className="icon-arrow-up"></i>
                  +3.3%
                </span>
              </div>
              <div className="balance-actions">
                <button 
                  className="btn-recommendations"
                  onClick={() => setShowRecommendationsModal(true)}
                >
                  Recomendaciones
                  {unviewedRecommendationsCount > 0 && (
                    <span className="notification-badge">{unviewedRecommendationsCount}</span>
                  )}
                </button>
                <button 
                  className="btn-alerts"
                  onClick={() => setShowAlertsModal(true)}
                >
                  Alertas
                  {unviewedAlertsCount > 0 && (
                    <span className="notification-badge">{unviewedAlertsCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Income and Expense Cards - Side by Side */}
        <div className="income-expense-grid">
          {/* Income Card */}
          <div className="income-card">
            <h3>Ingreso mensual Actual</h3>
            <div className="income-content">
              {incomeTransactions.length === 0 ? (
                <EmptyState
                  message="Aún no tienes ingresos registrados"
                  icon="💰"
                  action={
                    <button onClick={() => openAddForm('income')}>
                      Añadir primer ingreso
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="income-amount">
                    {formatCurrency(calculateTotalIncome())}
                    <span className="income-change positive">
                      <i className="icon-arrow-up"></i>
                      +{monthlySummary?.income_change || 0}%
                    </span>
                  </div>
                  <p className="data-subtitle">Datos registrados</p>
                  
                  <div className="income-items">
                    {incomeTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="income-item">
                        <span className="item-category">{transaction.category}</span>
                        <span className="item-amount">+{formatCurrency(transaction.amount)}</span>
                        <div className="item-actions">
                          <button onClick={() => handleEdit(transaction)}>✏️</button>
                          <button onClick={() => handleDelete(transaction.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="total-income">
                    Total ingresos: {formatCurrency(calculateTotalIncome())}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn-add-income"
                      onClick={() => openAddForm('income')}
                    >
                      <i className="icon-plus"></i>
                      Añadir Ingreso
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Expense Card */}
          <div className="expense-card">
            <h3>Gasto mensual Actual</h3>
            <div className="expense-content">
              {expenseTransactions.length === 0 ? (
                <EmptyState
                  message="Aún no tienes gastos registrados"
                  icon="💸"
                  action={
                    <button onClick={() => openAddForm('expense')}>
                      Añadir primer gasto
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="expense-amount">
                    {formatCurrency(calculateTotalExpenses())}
                    <span className={`expense-change ${(monthlySummary?.expense_change || 0) < 0 ? 'positive' : 'negative'}`}>
                      <i className={`icon-arrow-${(monthlySummary?.expense_change || 0) < 0 ? 'down' : 'up'}`}></i>
                      {monthlySummary?.expense_change || 0}%
                    </span>
                  </div>
                  <p className="data-subtitle">Datos registrados</p>
                  
                  <div className="expense-items">
                    {expenseTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="expense-item">
                        <span className="item-category">{transaction.category}</span>
                        <span className="item-amount">-{formatCurrency(transaction.amount)}</span>
                        <div className="item-actions">
                          <button onClick={() => handleEdit(transaction)}>✏️</button>
                          <button onClick={() => handleDelete(transaction.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="total-expense">
                    Total gastos: {formatCurrency(calculateTotalExpenses())}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn-add-expense"
                      onClick={() => openAddForm('expense')}
                    >
                      <i className="icon-plus"></i>
                      Añadir Gasto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>{editingTransaction ? 'Editar Transacción' : `Añadir ${transactionType === 'income' ? 'Ingreso' : 'Gasto'}`}</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="transaction-form">
                <div className="form-group">
                  <label>Monto *</label>
                  <input
                    type="text"
                    value={amountValue}
                    onChange={handleAmountChange}
                    className={errors.amount ? 'error' : ''}
                    placeholder="0"
                  />
                  <input
                    type="hidden"
                    {...register('amount', { 
                      required: 'El monto es obligatorio',
                      min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                      max: { value: 1000000000, message: 'El monto no puede exceder $1.000.000.000' }
                    })}
                  />
                  {errors.amount && <span className="error-text">{errors.amount.message}</span>}
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    {...register('category', { required: 'La categoría es obligatoria' })}
                    className={errors.category ? 'error' : ''}
                  >
                    <option value="">Seleccionar categoría</option>
                    {(transactionType === 'income' ? incomeCategories : expenseCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <span className="error-text">{errors.category.message}</span>}
                </div>

                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    {...register('date', { 
                      required: 'La fecha es obligatoria',
                      validate: {
                        notFuture: (value) => {
                          if (!value) return true
                          const selectedDate = new Date(value)
                          const today = new Date()
                          today.setHours(23, 59, 59, 999) // Permitir hasta el final del día de hoy
                          return selectedDate <= today || 'La fecha no puede ser futura'
                        }
                      }
                    })}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.date ? 'error' : ''}
                  />
                  {errors.date && <span className="error-text">{errors.date.message}</span>}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    {...register('description', { 
                      maxLength: { value: 200, message: 'Máximo 200 caracteres' }
                    })}
                    className={errors.description ? 'error' : ''}
                    placeholder="Descripción opcional (máximo 200 caracteres)"
                    rows="3"
                  />
                  {errors.description && <span className="error-text">{errors.description.message}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" onClick={handleCancel} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTransaction ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alerts Modal */}
        <AlertsModal 
          isOpen={showAlertsModal} 
          onClose={() => setShowAlertsModal(false)} 
        />

        {/* Recommendations Modal */}
        <RecommendationsModal 
          isOpen={showRecommendationsModal} 
          onClose={() => setShowRecommendationsModal(false)} 
        />
      </div>
    </DashboardLayout>
  )
}

export default IncomeExpenses