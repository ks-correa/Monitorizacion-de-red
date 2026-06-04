import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import DashboardCards from '../components/DashboardCards'
import { useMainGoal } from '../hooks/useMainGoal'
import { useDashboardExpenses } from '../hooks/useDashboardExpenses'
import { formatCurrency } from '../utils/formatters'
import '../styles/dashboard.css'

const Dashboard = () => {
  const {
    goalData,
    loading: goalLoading,
    getGoalDisplayName,
    currentAmount,
    targetAmount,
    progressPercentage,
    remainingAmount
  } = useMainGoal()

  const {
    loading: expensesLoading,
    expenseCategories,
    error: expensesError
  } = useDashboardExpenses()

  // Colores para la gráfica (mismo estilo que Reports)
  const COLORS = [
    '#ea580c', '#3b82f6', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <DashboardLayout>
      <DashboardCards />
      
      {/* Main Goal Card - Full Width */}
      <div className="dashboard-card card-goal card-goal-full">
        <div className="card-header">
          <h3 className="card-title">Meta Principal</h3>
          <svg className="card-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div className="card-content goal-content-layout">
          <div className="goal-main-info">
            <div className="goal-title">
              {goalData ? (goalData.goal_name || getGoalDisplayName(goalData.goal_type)) : 'No hay meta configurada'}
            </div>
            <div className="goal-amount">
              $ {formatCurrency(currentAmount)} <span className="goal-target">/ $ {formatCurrency(targetAmount)}</span>
            </div>
            {goalData?.goal_timeframe && (
              <div className="goal-timeframe">
                <svg className="goal-timeframe-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.81 0-1.81-1.49-2.69-3.66-3.21z"/>
                </svg>
                Plazo: {goalData.goal_timeframe} {goalData.goal_timeframe === 1 ? 'mes' : 'meses'}
              </div>
            )}
          </div>
          <div className="goal-progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ '--progress-width': `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="progress-info">
              <div className="progress-stat">
                <span className="progress-label">Progreso</span>
                <span className="progress-value">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="progress-stat">
                <span className="progress-label">Faltan</span>
                <span className="progress-value">$ {formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Description Card - Split Layout */}
      <div className="dashboard-card card-expenses">
        <div className="card-header">
          <h3 className="card-title">Descripción de los Gastos</h3>
          <svg className="card-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>
        <div className="card-content">
          {expensesLoading ? (
            <div className="expenses-loading">
              <div className="loading-spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : expensesError ? (
            <div className="expenses-error">
              <p>Error al cargar los datos</p>
            </div>
          ) : expenseCategories && expenseCategories.length > 0 ? (
            <div className="expenses-split-layout">
              <div className="expenses-chart-section">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ right: 20 }}>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #ccc', 
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="expenses-list-section">
                <div className="expenses-summary">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="expense-category-item">
                      <div className="category-item-left">
                        <div 
                          className="category-color" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="category-name">{category.category}</span>
                      </div>
                      <div className="category-item-right">
                        <span className="category-amount">{formatCurrency(category.amount)}</span>
                        <span className="category-percentage">{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="expenses-empty">
              <div className="empty-chart">
                <div className="donut-chart">
                  <div className="donut-placeholder"></div>
                </div>
              </div>
              <div className="empty-message">No hay gastos registrados este mes</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard