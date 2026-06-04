import React from 'react'
import { useDashboardCards } from '../hooks/useDashboardCards'
import { formatCurrency } from '../utils/formatters'

const DashboardCards = () => {
  const {
    loading,
    balance,
    budget,
    income,
    expense,
    totalSavings,
    balanceTrend,
    savingsTrend
  } = useDashboardCards()

  return (
    <div className="dashboard-cards">
      {/* Total Balance Card */}
      <div className="dashboard-card card-balance">
        <div className="card-header">
          <h3 className="card-title">Saldo Total</h3>
          <span className={`card-trend ${balance >= 0 ? 'positive' : 'negative'}`}>
            {balance >= 0 ? '↑' : '↓'} {balanceTrend}
          </span>
        </div>
        <div className="card-content">
          <div className="card-amount">CO ${formatCurrency(Math.abs(balance))}</div>
          <div className="card-details">
            <span className="detail-item income">
              Ingreso <span className="amount">${formatCurrency(budget + income)}</span>
            </span>
            <span className="detail-item expense">
              Gasto <span className="amount">${formatCurrency(expense)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Total Savings Card */}
      <div className="dashboard-card card-savings">
        <div className="card-header">
          <h3 className="card-title">Ahorro Total</h3>
          <span className={`card-trend ${totalSavings > 0 ? 'positive' : 'neutral'}`}>
            {totalSavings > 0 ? '↑' : '→'} {savingsTrend}
          </span>
        </div>
        <div className="card-content">
          <div className="card-amount">CO ${formatCurrency(totalSavings)}</div>
        </div>
        <div className="card-chart">
          {/* Placeholder for chart - se implementará con datos reales */}
        </div>
      </div>
    </div>
  )
}

export default DashboardCards