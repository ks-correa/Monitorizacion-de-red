import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import { CardSkeleton, ListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { formatCurrency } from '../config/config'
import { useGoals } from '../hooks/useGoals'
import '../styles/Goals.css'

const Goals = () => {
  const {
    goals,
    stats,
    trends,
    loading,
    error,
    showAddForm,
    showContributeForm,
    editingGoal,
    selectedGoal,
    mainGoal,
    contributeAmount,
    formattedTargetAmount,
    formattedContributeAmount,
    isSubmitting,
    validationErrors,
    monthlySavings,
    dailyContributions,
    selectedGoalForChart,
    contributionDate,
    currentMonth,
    currentYear,
    savingsMonthsToShow,
    goalCategories,
    register,
    handleSubmit,
    errors,
    formatAmount,
    parseAmount,
    handleAmountChange,
    getGoalDisplayName,
    getProgressColor,
    getAllGoals,
    onSubmit,
    handleEdit,
    handleDelete,
    handleContribute,
    handleSetAsMain,
    onSubmitContribution,
    handleGoalChangeForChart,
    handleMonthYearChange,
    handleSavingsMonthsChange,
    setShowAddForm,
    setShowContributeForm,
    setFormattedTargetAmount,
    setFormattedContributeAmount,
    setContributeAmount,
    setContributionDate
  } = useGoals()

  if (loading) {
    return (
      <DashboardLayout hideBudget={true}>
        <div className="goals-container">
          <div className="page-header">
            <h1>Metas</h1>
          </div>
          <CardSkeleton />
          <ListSkeleton count={3} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout hideBudget={true}>
      <div className="goals-container">
        {/* Header */}
        <div className="page-header">
          <h1>Metas</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="icon-warning"></i>
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total-saved">
            <div className="card-icon">
              <i className="icon-money-bag">💰</i>
            </div>
            <div className="card-content">
              <h3>Total Ahorrado</h3>
              <div className="card-value">
                <span className="currency">COP</span>
                <span className="amount">{formatCurrency(stats.total_saved).replace('COP', '').trim()}</span>
              </div>
            </div>
          </div>

          <div className="summary-card active-goals">
            <div className="card-icon">
              <i className="icon-target">🎯</i>
            </div>
            <div className="card-content">
              <h3>N.º de Metas Activas</h3>
              <div className="card-value">
                <span className="number">{stats.active_goals_count}</span>
                <span className="label">metas</span>
              </div>
            </div>
          </div>

          <div className="summary-card investments">
            <div className="card-icon">
              <i className="icon-chart">📈</i>
            </div>
            <div className="card-content">
              <h3>N.º de Inversiones</h3>
              <div className="card-value">
                <span className="number">{stats.investments_count || 0}</span>
                <span className="label">{stats.investments_count === 1 ? 'inversión' : 'inversiones'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-controls-header">
              <div>
                <h3>Ahorro mensual</h3>
                <div className="chart-subtitle">
                  Abonos mensuales a metas de categoría "Ahorros"
                </div>
              </div>
              <div className="months-selector">
                <label htmlFor="savings-months-select" className="chart-label">Mostrar:</label>
                <select 
                  id="savings-months-select"
                  className="chart-select"
                  value={savingsMonthsToShow} 
                  onChange={(e) => handleSavingsMonthsChange(parseInt(e.target.value))}
                >
                  <option value="3">Últimos 3 meses</option>
                  <option value="6">Últimos 6 meses</option>
                  <option value="12">Últimos 12 meses</option>
                  <option value="24">Últimos 24 meses</option>
                </select>
              </div>
            </div>
            <div className="chart-container chart-container-fixed">
              {monthlySavings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySavings} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Ahorro']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Ahorro mensual"
                      dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  <p>No hay datos de ahorro mensual</p>
                  <small>Crea una meta de categoría "Ahorros" y realiza abonos para ver la gráfica</small>
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-controls-header">
              <div>
                <h3>Abonos del mes</h3>
                <div className="chart-subtitle">
                  {selectedGoalForChart 
                    ? `${new Date(currentYear, currentMonth - 1).toLocaleString('es', { month: 'long', year: 'numeric' })}` 
                    : 'Selecciona una meta para ver sus abonos'}
                </div>
              </div>
              <div className="chart-filters">
                <div className="goal-selector">
                  <label htmlFor="goal-select" className="chart-label">Meta:</label>
                  <select 
                    id="goal-select"
                    className="chart-select min-width"
                    value={selectedGoalForChart} 
                    onChange={(e) => handleGoalChangeForChart(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {getAllGoals().map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedGoalForChart && (
                  <>
                    <div className="month-selector">
                      <label htmlFor="month-select" className="chart-label">Mes:</label>
                      <select 
                        id="month-select"
                        className="chart-select"
                        value={currentMonth} 
                        onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentYear)}
                      >
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </select>
                    </div>
                    <div className="year-selector">
                      <label htmlFor="year-select" className="chart-label">Año:</label>
                      <select 
                        id="year-select"
                        className="chart-select"
                        value={currentYear} 
                        onChange={(e) => handleMonthYearChange(currentMonth, parseInt(e.target.value))}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="chart-container chart-container-fixed">
              {selectedGoalForChart && dailyContributions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyContributions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      label={{ value: 'Día del mes', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Abono']}
                      labelFormatter={(day) => `Día ${day}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      fill="#f59e0b" 
                      name="Abono diario"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  {selectedGoalForChart 
                    ? <><p>No hay abonos registrados en {new Date(currentYear, currentMonth - 1).toLocaleString('es', { month: 'long' })}</p>
                       <small>Realiza abonos a esta meta para ver la gráfica</small></> 
                    : <><p>Selecciona una meta</p>
                       <small>Usa el selector de arriba para elegir una meta y ver sus abonos del mes</small></>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals and Trends Section */}
        <div className="goals-trends-section">
          {/* My Goals */}
          <div className="my-goals">
            <h2>Mis Metas</h2>
            {!loading && getAllGoals().length === 0 ? (
              <EmptyState
                message="Aún no tienes metas creadas"
                icon="🎯"
                action={
                  <button onClick={() => setShowAddForm(true)}>
                    Crear tu primera meta
                  </button>
                }
              />
            ) : (
              <div className="goals-list">
                {getAllGoals().map(goal => (
                  <div key={goal.id} className={`goal-item ${goal.is_main_goal ? 'main-goal' : ''}`}>
                    <div className="goal-info">
                      <h4>
                        {goal.name}
                        {goal.is_main_goal && <span className="main-goal-badge">Meta Principal</span>}
                      </h4>
                      <div className="goal-progress">
                        <span className="progress-text">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                        <span 
                          className="progress-percentage" 
                          style={{ 
                            '--progress-color': getProgressColor(goal.progress_percentage),
                            color: getProgressColor(goal.progress_percentage)
                          }}
                        >
                          {Math.round(goal.progress_percentage)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            '--progress-width': `${Math.min(goal.progress_percentage, 100)}%`,
                            '--progress-color': getProgressColor(goal.progress_percentage),
                            width: `${Math.min(goal.progress_percentage, 100)}%`,
                            backgroundColor: getProgressColor(goal.progress_percentage)
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="goal-actions">
                      <button 
                        className="btn-contribute"
                        onClick={() => handleContribute(goal)}
                        aria-label={`Abonar a la meta ${goal.name}`}
                        title={`Abonar a la meta ${goal.name}`}
                      >
                        Abonar
                      </button>
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(goal)}
                        aria-label={`Editar la meta ${goal.name}`}
                        title={`Editar la meta ${goal.name}`}
                      >
                        Editar
                      </button>
                      {!goal.is_main_goal && getAllGoals().length >= 2 && (
                        <button 
                          className="btn-main"
                          onClick={() => handleSetAsMain(goal)}
                          aria-label={`Establecer ${goal.name} como Meta Principal`}
                          title="Establecer como Meta Principal"
                        >
                          ⭐
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(goal)}
                        aria-label={`Eliminar la meta ${goal.name}`}
                        title={`Eliminar la meta ${goal.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Goals */}
          <div className="trending-goals">
            <h2>Metas en tendencia</h2>
            <div className="trend-banner">
              <span className="trend-badge">¡Tendencia Popular!</span>
              <p>Los viajes son la meta más común entre usuarios</p>
            </div>
            <div className="trend-stats">
              <div className="trend-stat">
                <div className="stat-line green"></div>
                <span>Ahorro promedio de usuarios</span>
                <strong>{formatCurrency(trends.average_savings)}</strong>
              </div>
              <div className="trend-stat">
                <div className="stat-line blue"></div>
                <span>Meta más común</span>
                <strong className="trend-category-name">{trends.most_common_category}</strong>
              </div>
              <div className="trend-stat">
                <div className="stat-line orange"></div>
                <span>Tiempo promedio de ahorro</span>
                <strong>{trends.average_savings_time_months} meses</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bottom-actions">
          <button 
            className="btn-add-goal"
            onClick={() => setShowAddForm(true)}
          >
            <span className="icon-plus"></span>
            Añadir Meta
          </button>
        </div>

        {/* Add/Edit Goal Form */}
        {showAddForm && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>{editingGoal ? 'Editar Meta' : 'Crear Nueva Meta'}</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="goal-form">
                <div className="form-group">
                  <label>Nombre de la Meta *</label>
                  <input
                    type="text"
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    className={(errors.name || validationErrors.name) ? 'error' : ''}
                    placeholder="Ej: Viaje a Europa"
                  />
                  {(errors.name || validationErrors.name) && (
                    <span className="error-text">
                      {validationErrors.name || errors.name?.message}
                    </span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Monto Objetivo *</label>
                    <input
                      type="text"
                      value={formattedTargetAmount}
                      onChange={(e) => handleAmountChange(e, setFormattedTargetAmount)}
                      className={validationErrors.target_amount ? 'error' : ''}
                      placeholder="5.000.000"
                    />
                    {validationErrors.target_amount && <span className="error-text">{validationErrors.target_amount}</span>}
                  </div>

                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      {...register('category', { required: 'La categoría es obligatoria' })}
                      className={(errors.category || validationErrors.category) ? 'error' : ''}
                    >
                      <option value="">Seleccionar categoría</option>
                      {goalCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {(errors.category || validationErrors.category) && (
                      <span className="error-text">
                        {validationErrors.category || errors.category?.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Fecha Objetivo</label>
                  <input
                    type="date"
                    {...register('target_date')}
                    className={(errors.target_date || validationErrors.target_date) ? 'error' : ''}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  {(errors.target_date || validationErrors.target_date) && (
                    <span className="error-text">
                      {validationErrors.target_date || errors.target_date?.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    {...register('description', { 
                      maxLength: { value: 500, message: 'Máximo 500 caracteres' }
                    })}
                    className={(errors.description || validationErrors.description) ? 'error' : ''}
                    placeholder="Describe tu meta (opcional)"
                    rows="3"
                  />
                  {(errors.description || validationErrors.description) && (
                    <span className="error-text">
                      {validationErrors.description || errors.description?.message}
                    </span>
                  )}
                </div>

                {/* Checkbox para marcar como meta principal - solo si hay 2 o más metas */}

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingGoal(null)
                      setFormattedTargetAmount('')
                      reset()
                    }} 
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Procesando...
                      </>
                    ) : (
                      editingGoal ? 'Actualizar Meta' : 'Crear Meta'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contribution Form */}
        {showContributeForm && selectedGoal && (
          <div className="form-overlay">
            <div className="form-container">
              <h2>Abonar a Meta</h2>
              
              <div className="goal-info-summary">
                <h3>{selectedGoal.name}</h3>
                <p>Progreso actual: {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}</p>
                <p>Progreso: {selectedGoal.progress_percentage}%</p>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitContribution)} className="contribution-form">
                <div className="form-group">
                  <label>Monto a abonar *</label>
                  <input
                    type="text"
                    value={formattedContributeAmount}
                    onChange={(e) => handleAmountChange(e, setFormattedContributeAmount)}
                    className={validationErrors.amount ? 'error' : ''}
                    placeholder="0"
                    required
                  />
                  {validationErrors.amount && <span className="error-text">{validationErrors.amount}</span>}
                  <small className="form-help">
                    Monto restante: {formatCurrency(selectedGoal.target_amount - selectedGoal.current_amount)}
                  </small>
                </div>

                <div className="form-group">
                  <label>Fecha del abono</label>
                  <input
                    type="date"
                    value={contributionDate}
                    onChange={(e) => setContributionDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="Fecha actual"
                  />
                  <small className="form-help">
                    Si no se especifica, se usará la fecha actual
                  </small>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowContributeForm(false)
                      setSelectedGoal(null)
                      setContributeAmount('')
                      setFormattedContributeAmount('')
                      setContributionDate('')
                    }} 
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Procesando...
                      </>
                    ) : (
                      'Abonar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Goals