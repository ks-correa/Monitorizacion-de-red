import { useState, useEffect, useRef } from 'react'
import { useBalance } from '../contexts/BalanceContext'
import { apiService } from '../services/apiService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Hook personalizado para manejar toda la lógica de Reports
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useReports = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  // Estados para los datos de reportes
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [expenseCategories, setExpenseCategories] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [incomeTrend, setIncomeTrend] = useState([])
  const [savingsEvolution, setSavingsEvolution] = useState([])
  const [incomeExpenseComparison, setIncomeExpenseComparison] = useState([])
  const pdfRef = useRef(null)

  const MONTHS_ES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  
  // Colores de la paleta
  const COLORS = ['#10b981', '#f59e0b']

  const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1)
    const endInclusive = new Date(year, month, 0)
    const toISO = (d) => (
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
    return {
      startStr: toISO(start),
      endStr: toISO(endInclusive),
      weekStartStr: toISO(start),
    }
  }

  const loadReportsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Validar que selectedYear y selectedMonth sean válidos
      if (!selectedYear || !selectedMonth || selectedMonth < 1 || selectedMonth > 12) {
        console.error('Año o mes inválido:', { selectedYear, selectedMonth })
        setError('Año o mes seleccionado inválido')
        setLoading(false)
        return
      }
      
      console.log('🔍 Cargando reportes para:', { selectedYear, selectedMonth })
      
      const { startStr, endStr, weekStartStr } = getMonthRange(selectedYear, selectedMonth)

      const [summary, categories, daily, income, savingsEvolutionData, incomeExpense] = await Promise.all([
        apiService.reports.getMonthlySummary(selectedYear, selectedMonth),
        apiService.reports.getExpenseCategories(startStr, endStr),
        apiService.reports.getDailyExpenses(weekStartStr),
        apiService.reports.getIncomeTrend(12, selectedYear, selectedMonth),
        apiService.reports.getSavingsEvolution(6, selectedYear, selectedMonth),
        apiService.reports.getIncomeExpenseComparison(8, selectedYear, selectedMonth)
      ])
      
      console.log('✅ Reportes cargados para:', { selectedYear, selectedMonth })
      
      console.log('Reports - Datos cargados:')
      console.log('Reports - summary:', summary)
      console.log('Reports - categories:', categories)
      console.log('Reports - daily:', daily)
      console.log('Reports - income:', income)
      console.log('Reports - savingsEvolutionData:', savingsEvolutionData)
      
      setMonthlySummary(summary)
      
      // El backend devuelve ExpenseCategoryReport con un campo categories
      const categoriesData = categories?.categories || []
      console.log('Reports - categoriesData extraído:', categoriesData)
      setExpenseCategories(categoriesData)
      setExpensesByCategory(categoriesData)
      
      // El backend devuelve DailyExpensesReport con un campo daily_data
      const dailyData = daily?.daily_data || []
      console.log('Reports - dailyData extraído:', dailyData)
      setDailyExpenses(dailyData)
      
      // El backend devuelve IncomeTrendReport con un campo monthly_data
      const incomeData = income?.monthly_data || []
      console.log('Reports - incomeData extraído:', incomeData)
      setIncomeTrend(incomeData)
      
      // Usar savingsEvolutionData del backend en lugar de goals.getMonthlySavings
      // Transformar los datos para que tengan el formato que espera la gráfica (amount en lugar de monthly_savings)
      const savingsDataRaw = savingsEvolutionData?.monthly_data || []
      const savingsData = savingsDataRaw.map(item => ({
        month: item.month,
        year: item.year,
        amount: item.monthly_savings || 0, // Usar monthly_savings como amount para la gráfica
        savings_amount: item.savings_amount || 0,
        savings_rate: item.savings_rate || 0
      }))
      console.log('Reports - evolución de ahorro (últimos meses):', savingsData)
      setSavingsEvolution(savingsData)
      
      // El backend devuelve IncomeExpenseComparisonReport con un campo monthly_data
      const comparisonData = incomeExpense?.monthly_data || []
      console.log('Reports - comparación ingresos vs gastos:', comparisonData)
      setIncomeExpenseComparison(comparisonData)

    } catch (err) {
      setError(err.message)
      console.error('Error cargando reportes:', err)
      // Mantener estados vacíos para mostrar empty states
      setMonthlySummary(null)
      setExpenseCategories([])
      setExpensesByCategory([])
      setDailyExpenses([])
      setIncomeTrend([])
      setSavingsEvolution([])
      setIncomeExpenseComparison([])
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (month) => {
    setSelectedMonth(parseInt(month))
  }

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year))
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    // Aquí se implementaría la búsqueda de reportes
  }

  const handleExportPDF = async () => {
    try {
      if (!pdfRef.current) return
      // una pequeña pausa para asegurar el renderizado completo de las gráficas
      await new Promise(r => setTimeout(r, 50))
      
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: '#fff',
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      const pxToMm = (px) => px * 0.264583
      const imgWmm = pxToMm(canvas.width)
      const imgHmm = pxToMm(canvas.height)
      const ratio = Math.min(pageW / imgWmm, pageH / imgHmm)
      const drawW = imgWmm * ratio
      const drawH = imgHmm * ratio
      const offsetX = (pageW - drawW) / 2
      const offsetY = (pageH - drawH) / 2

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH)

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      pdf.save(`ResumenMensual_${yyyy}-${mm}.pdf`)
    } catch (err) {
      setError('Error al exportar reporte')
    }
  }

  useEffect(() => {
    // Limpiar datos anteriores antes de cargar nuevos
    setMonthlySummary(null)
    setExpenseCategories([])
    setExpensesByCategory([])
    setDailyExpenses([])
    setIncomeTrend([])
    setSavingsEvolution([])
    setIncomeExpenseComparison([])
    setError(null)
    
    // Cargar nuevos datos
    loadReportsData()
  }, [selectedMonth, selectedYear])

  return {
    // Estados
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
    
    // Constantes
    MONTHS_ES_SHORT,
    COLORS,
    
    // Handlers
    handleMonthChange,
    handleYearChange,
    handleSearch,
    handleExportPDF
  }
}

