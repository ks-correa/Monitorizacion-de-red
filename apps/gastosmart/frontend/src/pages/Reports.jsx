import React from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, 
  ComposedChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import { CardSkeleton, ChartSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { formatCurrency } from '../config/config'
import { useReports } from '../hooks/useReports'
import '../styles/Reports.css'

const Reports = () => {
  const {
    loading,
    error,
    selectedMonth,
    selectedYear,
    searchQuery,
    monthlySummary,
    expenseCategories,
    expensesByCategory,
    dailyExpenses,
    incomeTrend,
    savingsEvolution,
    incomeExpenseComparison,
    pdfRef,
    COLORS,
    handleMonthChange,
    handleYearChange,
    handleSearch,
    handleExportPDF
  } = useReports()

  if (loading) {
    return (
      <DashboardLayout hideBudget={true}>
        <div className="reports-container">
          <div className="page-header">
            <h1>Reportes</h1>
          </div>
          <CardSkeleton />
          <div className="charts-grid">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout hideBudget={true}>
      <div className="reports-container">
        {/* Header */}
        <div className="page-header">
          <h1>Reportes</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="icon-warning"></i>
            {error}
          </div>
        )}

        {/* Top Controls */}
        <div className="reports-controls">
          <div className="controls-left">
            <select 
              className="month-selector"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
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

            <select 
              className="year-selector"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <button className="btn-generate-pdf" onClick={handleExportPDF}>
            <i className="icon-document"></i>
            Generar PDF
          </button>
        </div>
        

        {/* Contenido a exportar (Resumen Mensual + TODAS las gráficas) */}
        <div ref={pdfRef} id="pdf-capture">
        {/* Monthly Summary Card - Resumen Mensual */}
        {monthlySummary ? (
          <div className="monthly-summary-card">
            <h3>
              Resumen Mensual - {new Date(selectedYear, selectedMonth - 1).toLocaleString('es', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="monthly-summary-grid">
              <div className="summary-item">
                <div className="summary-label">Total de Ingresos</div>
                <div className="summary-value income">
                  {formatCurrency(monthlySummary.total_income || 0)}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Total de Gastos</div>
                <div className="summary-value expense">
                  {formatCurrency(monthlySummary.total_expenses || 0)}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Balance Neto</div>
                <div className={`summary-value balance ${(monthlySummary?.balance ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(monthlySummary?.balance ?? 0)}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Porcentaje de Ahorro</div>
                <div className="summary-value savings">
                  {(() => {
                    const income = monthlySummary?.total_income ?? 0;
                    const expenses = monthlySummary?.total_expenses ?? 0;
                    const monthlyBalance = monthlySummary?.balance ?? 0;
                    
                    // Calcular porcentaje de ahorro basado solo en los datos del mes seleccionado
                    const percentage = income > 0
                      ? Math.min(100, Math.max(0, (monthlyBalance / income) * 100))
                      : 0;

                    return `${percentage.toFixed(1)}%`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            message="Aún no tienes transacciones registradas para este mes"
            icon="📊"
          />
        )}

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Daily Expenses Chart - Días con mayores gastos */}
          <div className="chart-card">
            <h3>Días con mayores gastos</h3>
            <div className="chart-subtitle">
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('es', { month: 'long', year: 'numeric' })}
            </div>
            <div className="chart-container chart-container-fixed">
              {dailyExpenses && dailyExpenses.length > 0 && dailyExpenses.some(item => item.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyExpenses} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Día del mes', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Gasto']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#f59e0b" name="Gastos diarios" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de gastos diarios este mes
                </div>
              )}
            </div>
          </div>

          {/* Income Trend Chart - Ingresos anuales */}
          <div className="chart-card">
            <h3>Ingresos</h3>
            <div className="chart-subtitle">
              Tendencia anual de ingresos
            </div>
            <div className="chart-container chart-container-fixed">
              {incomeTrend && incomeTrend.length > 0 && incomeTrend.some(item => item.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={incomeTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Ingreso']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Ingresos mensuales"
                      dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de ingresos
                </div>
              )}
            </div>
          </div>

          {/* Expense Distribution Chart - Distribución de gastos (Pie Chart) */}
          <div className="chart-card">
            <h3>Distribución de gastos</h3>
            <div className="chart-subtitle">
              Porcentaje por categoría
            </div>
            <div className="chart-container chart-container-fixed">
              {expenseCategories && expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de distribución de gastos
                </div>
              )}
            </div>
          </div>

          {/* Savings Evolution Chart - Evolución de ahorro (Area Chart) */}
          <div className="chart-card">
            <h3>Evolución de Ahorro</h3>
            <div className="chart-subtitle">
              Últimos 6 meses
            </div>
            <div className="chart-container chart-container-fixed">
              {savingsEvolution && savingsEvolution.length > 0 && savingsEvolution.some(item => item.amount > 0 || item.savings_amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsEvolution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 'auto']} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Ahorro del mes']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSavings)" 
                      name="Ahorro mensual"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de evolución de ahorro
                </div>
              )}
            </div>
          </div>

          {/* NEW: Gastos por Categoría (Bar Chart) */}
          <div className="chart-card">
            <h3>Gastos por categoría</h3>
            <div className="chart-subtitle">
              Identificación de categorías con mayor consumo
            </div>
            <div className="chart-container chart-container-fixed">
              {expensesByCategory && expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesByCategory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Monto']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Gasto por categoría" radius={[8, 8, 0, 0]}>
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de gastos por categoría
                </div>
              )}
            </div>
          </div>

          {/* NEW: Comparación Ingresos vs Gastos (ComposedChart) */}
          <div className="chart-card">
            <h3>Comparación Ingresos vs Gastos</h3>
            <div className="chart-subtitle">
              Últimos 8 meses
            </div>
            <div className="chart-container chart-container-fixed">
              {incomeExpenseComparison && incomeExpenseComparison.length > 0 && incomeExpenseComparison.some(item => (item.income > 0 || item.expenses > 0)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={incomeExpenseComparison} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Ingresos') {
                          return [formatCurrency(value), 'Ingresos']
                        } else if (name === 'Gastos') {
                          return [formatCurrency(value), 'Gastos']
                        }
                        return [formatCurrency(value), name]
                      }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      name="Ingresos" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Gastos" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  No hay datos de comparación ingresos vs gastos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>  
    </div>
    </DashboardLayout>
  )
}

export default Reports