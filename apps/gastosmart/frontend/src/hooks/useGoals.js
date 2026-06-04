import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { apiService } from '../services/apiService'
import { useBalance } from '../contexts/BalanceContext'
import { formatCurrency } from '../config/config'

/**
 * Hook personalizado para manejar toda la lógica de metas
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useGoals = () => {
  const { balance: globalBalance, refreshBalance } = useBalance()
  const [goals, setGoals] = useState([])
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showContributeForm, setShowContributeForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [mainGoal, setMainGoal] = useState(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [formattedTargetAmount, setFormattedTargetAmount] = useState('')
  const [formattedContributeAmount, setFormattedContributeAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [monthlySavings, setMonthlySavings] = useState([])
  const [dailyContributions, setDailyContributions] = useState([])
  const [selectedGoalForChart, setSelectedGoalForChart] = useState('')
  const [contributionDate, setContributionDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [savingsMonthsToShow, setSavingsMonthsToShow] = useState(6)

  const hasLoadedRef = useRef(false)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  // Goal categories
  const goalCategories = [
    'Fondo de Emergencia',
    'Viajes',
    'Educación',
    'Vivienda',
    'Vehículo',
    'Tecnología',
    'Salud',
    'Boda',
    'Jubilación',
    'Ahorros',
    'Inversiones',
    'Otros'
  ]

  // Función para formatear montos con separadores de miles
  const formatAmount = (value) => {
    if (!value) return ''
    const numericValue = value.replace(/[^\d]/g, '')
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Función para parsear montos formateados
  const parseAmount = (formattedValue) => {
    if (!formattedValue) return 0
    return parseInt(formattedValue.replace(/\./g, '')) || 0
  }

  // Función para manejar cambios en campos de monto
  const handleAmountChange = (e, setter) => {
    const formatted = formatAmount(e.target.value)
    setter(formatted)
  }

  // Función para formatear nombres de mes
  const formatMonthName = (monthStr) => {
    const months = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
      '1': 'Ene', '2': 'Feb', '3': 'Mar', '4': 'Abr',
      '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Ago',
      '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    }
    return months[monthStr] || monthStr
  }

  // Mapear nombres de metas a textos legibles
  const getGoalDisplayName = (goalType) => {
    const goalNames = {
      'emergencia': 'Fondo de Emergencia',
      'viaje': 'Vacaciones',
      'casa': 'Comprar Casa',
      'educacion': 'Educación',
      'other': mainGoal?.goal_name || 'Meta Personalizada'
    }
    return goalNames[goalType] || goalType
  }

  // Función para obtener color de progreso
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return '#10b981'
    if (percentage >= 25) return '#f59e0b'
    return '#ef4444'
  }

  // Cargar la meta principal desde el backend
  const loadMainGoal = async () => {
    try {
      console.log('Goals - Cargando meta principal desde backend...')
      const goalsData = await apiService.goals.getGoals()
      const mainGoalFromBackend = goalsData.find(goal => goal.is_main === true)
      
      if (mainGoalFromBackend) {
        console.log('Goals - Meta principal encontrada:', mainGoalFromBackend.name)
        const formattedMainGoal = {
          goal_name: mainGoalFromBackend.name,
          goal_type: mainGoalFromBackend.category,
          goal_amount: mainGoalFromBackend.target_amount,
          current_amount: mainGoalFromBackend.current_amount,
          progress_percentage: mainGoalFromBackend.progress_percentage,
          goal_timeframe: mainGoalFromBackend.target_date ? 
            Math.ceil((new Date(mainGoalFromBackend.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : null,
          id: mainGoalFromBackend.id,
          backend_id: mainGoalFromBackend.id
        }
        setMainGoal(formattedMainGoal)
        localStorage.setItem('userFinancialGoal', JSON.stringify(formattedMainGoal))
        localStorage.setItem('mainGoalId', mainGoalFromBackend.id)
        console.log('Goals - Meta principal cargada exitosamente')
      } else {
        console.log('Goals - No se encontró meta principal en el backend')
        setMainGoal(null)
      }
    } catch (error) {
      console.error('Goals - Error cargando meta principal:', error)
      setMainGoal(null)
    }
  }

  // Función centralizada para refrescar todos los datos de metas
  const refreshGoalsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Goals - refreshGoalsData - Iniciando peticiones al API...')
      
      const [goalsData, statsData, trendsData, savingsData] = await Promise.all([
        apiService.goals.getGoals(),
        apiService.goals.getStats(),
        apiService.goals.getTrends(),
        apiService.goals.getMonthlySavings(6)
      ])
      
      let contributionsData = []
      if (selectedGoalForChart) {
        contributionsData = await apiService.goals.getDailyContributionsByGoal(selectedGoalForChart, currentYear, currentMonth)
      }
        
      console.log('Goals - refreshGoalsData - Datos recibidos del API')
      
      setGoals(goalsData || [])
      
      const activeGoalsCount = (goalsData || []).filter(g => g.status === 'active').length
      const investmentsCount = (goalsData || []).filter(g => g.category === 'Inversiones').length
      const totalSavedFromSavings = (goalsData || [])
        .filter(g => g.category === 'Ahorros')
        .reduce((sum, g) => sum + (g.current_amount || 0), 0)
      
      setStats({
        ...statsData,
        total_saved: totalSavedFromSavings,
        active_goals_count: activeGoalsCount,
        investments_count: investmentsCount
      })
      setTrends(trendsData || {
        average_savings: 0,
        most_common_category: 'Viajes',
        average_savings_time_months: 12
      })
      
      const savingsFormatted = (savingsData || []).map(s => ({
        month: formatMonthName(s.month.toString().padStart(2, '0')),
        amount: s.amount
      }))
      
      const contributionsFormatted = (contributionsData || []).map(c => ({
        day: c.day,
        date: c.date,
        amount: c.amount
      }))
      
      setMonthlySavings(savingsFormatted)
      setDailyContributions(contributionsFormatted)
      
    } catch (err) {
      console.error('Goals - refreshGoalsData - Error cargando datos:', err)
      setError('Error al cargar las metas. Intente nuevamente.')
      setGoals([])
      setStats({
        total_saved: 0,
        active_goals_count: 0,
        investments_count: 0
      })
      setTrends({
        average_savings: 0,
        most_common_category: 'Viajes',
        average_savings_time_months: 12
      })
      setMonthlySavings([])
      setDailyContributions([])
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Goals - loadData - Iniciando carga de datos')
      await refreshGoalsData()
    } catch (err) {
      console.error('Goals - loadData - Error general cargando metas:', err)
      setError('Error al cargar las metas. Mostrando datos por defecto.')
      setGoals([])
      setStats({
        total_saved: 0,
        active_goals_count: 0,
        investments_count: 0
      })
      setTrends({
        average_savings: 0,
        most_common_category: 'Viajes',
        average_savings_time_months: 12
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejador para cambio de meta en gráfica de abonos diarios
  const handleGoalChangeForChart = async (goalId) => {
    setSelectedGoalForChart(goalId)
    if (!goalId) {
      setDailyContributions([])
      return
    }
    
    try {
      const contributionsData = await apiService.goals.getDailyContributionsByGoal(goalId, currentYear, currentMonth)
      const contributionsFormatted = (contributionsData || []).map(c => ({
        day: c.day,
        date: c.date,
        amount: c.amount
      }))
      setDailyContributions(contributionsFormatted)
    } catch (error) {
      console.error('Error al cargar abonos diarios por meta:', error)
      setDailyContributions([])
    }
  }

  // Manejador para cambio de mes/año en gráfica de abonos diarios
  const handleMonthYearChange = async (month, year) => {
    setCurrentMonth(month)
    setCurrentYear(year)
    
    if (selectedGoalForChart) {
      try {
        const contributionsData = await apiService.goals.getDailyContributionsByGoal(selectedGoalForChart, year, month)
        const contributionsFormatted = (contributionsData || []).map(c => ({
          day: c.day,
          date: c.date,
          amount: c.amount
        }))
        setDailyContributions(contributionsFormatted)
      } catch (error) {
        console.error('Error al cargar abonos diarios:', error)
        setDailyContributions([])
      }
    }
  }

  // Manejador para cambio de meses a mostrar en ahorro mensual
  const handleSavingsMonthsChange = async (months) => {
    setSavingsMonthsToShow(months)
    try {
      const savingsData = await apiService.goals.getMonthlySavings(months)
      console.log('handleSavingsMonthsChange - savingsData recibido:', savingsData)
      
      const savingsFormatted = (savingsData || []).map(s => ({
        month: formatMonthName(s.month.toString().padStart(2, '0')),
        amount: s.amount
      }))
      
      console.log('handleSavingsMonthsChange - savingsFormatted:', savingsFormatted)
      setMonthlySavings(savingsFormatted)
    } catch (error) {
      console.error('Error al cargar ahorro mensual:', error)
    }
  }

  // Combinar meta principal con metas adicionales
  const getAllGoals = () => {
    const allGoals = []
    
    if (mainGoal) {
      const realMainGoal = goals.find(goal => goal.is_main === true || goal.is_main_goal === true)
      if (realMainGoal) {
        realMainGoal.is_main_goal = true
        allGoals.push(realMainGoal)
      } else {
        allGoals.push({
          id: 'main-goal',
          name: mainGoal.goal_name || getGoalDisplayName(mainGoal.goal_type),
          target_amount: mainGoal.goal_amount,
          current_amount: 0,
          progress_percentage: 0,
          category: getGoalDisplayName(mainGoal.goal_type),
          description: mainGoal.description || '',
          is_main_goal: true,
          target_date: mainGoal.goal_timeframe ? new Date(Date.now() + mainGoal.goal_timeframe * 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
      }
    }
    
    const additionalGoals = goals
      .map(g => ({ ...g, is_main_goal: g.is_main === true ? true : false }))
      .filter(goal => !goal.is_main_goal)
    allGoals.push(...additionalGoals)
    
    return allGoals
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setValidationErrors({})
      
      const errors = {}
      
      if (!data.name || data.name.trim() === '') {
        errors.name = 'El nombre de la meta es requerido'
      } else if (data.name.trim().length < 3) {
        errors.name = 'El nombre debe tener al menos 3 caracteres'
      } else if (data.name.trim().length > 100) {
        errors.name = 'El nombre no puede exceder 100 caracteres'
      }
      
      if (!data.category || data.category.trim() === '') {
        errors.category = 'La categoría es requerida'
      }
      
      const targetAmount = parseAmount(formattedTargetAmount)
      if (!targetAmount || targetAmount <= 0) {
        errors.target_amount = 'El monto objetivo debe ser mayor que cero'
      } else if (targetAmount < 1000) {
        errors.target_amount = 'El monto objetivo debe ser al menos $1.000'
      } else if (targetAmount > 1000000000) {
        errors.target_amount = 'El monto objetivo no puede exceder $1.000.000.000'
      }
      
      if (data.target_date) {
        const targetDate = new Date(data.target_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        targetDate.setHours(0, 0, 0, 0)
        
        if (targetDate <= today) {
          errors.target_date = 'La fecha objetivo debe ser posterior a la fecha actual'
        } else {
          const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
          if (daysDiff > 3650) {
            errors.target_date = 'La fecha objetivo no puede exceder 10 años desde hoy'
          }
        }
      } else {
        // Si no se proporciona fecha, es opcional, pero si se requiere, se puede agregar validación aquí
      }
      
      if (data.description && data.description.length > 500) {
        errors.description = 'La descripción no puede exceder 500 caracteres'
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setError('Por favor corrige los errores en el formulario antes de continuar')
        setIsSubmitting(false)
        return
      }
      
      const goalData = {
        name: data.name.trim(),
        target_amount: targetAmount,
        category: data.category,
        description: data.description || '',
        target_date: data.target_date ? new Date(data.target_date).toISOString().split('T')[0] : null,
        current_amount: editingGoal ? editingGoal.current_amount : 0,
        currency: 'COP',
        is_public: false,
        is_main: false
      }
      
      console.log(editingGoal ? 'Editando meta:' : 'Creando meta:', goalData)
      
      try {
        if (editingGoal) {
          await apiService.goals.update(editingGoal.id, goalData)
          console.log('Meta actualizada exitosamente')
        } else {
          await apiService.goals.create(goalData)
          console.log('Meta creada exitosamente')
        }
      } catch (apiError) {
        console.error('Error en API:', apiError)
        setIsSubmitting(false)
        
        if (apiError.response?.status === 422) {
          const backendErrors = apiError.response.data?.detail || {}
          // Convertir errores del backend al formato esperado
          const formattedErrors = {}
          if (Array.isArray(backendErrors)) {
            // Si es un array de errores de Pydantic
            backendErrors.forEach(err => {
              if (err.loc && err.loc.length > 0) {
                const field = err.loc[err.loc.length - 1]
                formattedErrors[field] = err.msg
              }
            })
          } else if (typeof backendErrors === 'object') {
            // Si es un objeto con campos
            Object.keys(backendErrors).forEach(key => {
              formattedErrors[key] = Array.isArray(backendErrors[key]) 
                ? backendErrors[key][0] 
                : backendErrors[key]
            })
          }
          
          setValidationErrors(formattedErrors)
          setError('Por favor corrige los errores en el formulario antes de continuar')
          return
        }
        
        const errorMessage = apiError.response?.data?.detail || apiError.message || 'Error al procesar la meta'
        setError(errorMessage)
        return
      }
      
      setShowAddForm(false)
      setEditingGoal(null)
      setFormattedTargetAmount('')
      setValidationErrors({})
      reset()
      
      await refreshGoalsData()
      loadMainGoal()
      
    } catch (err) {
      console.error('Error procesando meta:', err)
      setError(err.message || 'Error al procesar la meta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setShowAddForm(true)
    
    setValue('name', goal.name)
    setValue('target_amount', goal.target_amount)
    setValue('category', goal.category)
    setValue('description', goal.description || '')
    setValue('target_date', goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : '')
    
    setFormattedTargetAmount(formatAmount(goal.target_amount.toString()))
  }

  const handleDelete = async (goal) => {
    const allGoals = getAllGoals()
    
    if (allGoals.length <= 1) {
      setError('No puedes eliminar la única meta. Crea una nueva meta antes de eliminar esta.')
      return
    }
    
    if (goal.is_main_goal && allGoals.length > 1) {
      const otherGoals = allGoals.filter(g => g.id !== goal.id)
      const newMainGoal = otherGoals[0]
      
      if (!window.confirm(`¿Estás seguro de eliminar la meta principal "${goal.name}"? La meta "${newMainGoal.name}" se establecerá como nueva meta principal.`)) {
        return
      }
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar la meta "${goal.name}"?`)) {
        return
      }
    }
    
    try {
      setError(null)
      
      try {
        await apiService.goals.delete(goal.id)
        console.log('Meta eliminada exitosamente')
      } catch (apiError) {
        console.warn('Error eliminando meta en API:', apiError)
        const updatedGoals = goals.filter(g => g.id !== goal.id)
        setGoals(updatedGoals)
      }
      
      if (goal.is_main_goal) {
        const remainingGoals = allGoals.filter(g => g.id !== goal.id)
        if (remainingGoals.length > 0) {
          const newMainGoal = remainingGoals[0]
          const mainGoalData = {
            goal_type: newMainGoal.category.toLowerCase().replace(/\s+/g, '_'),
            goal_name: newMainGoal.name,
            goal_amount: newMainGoal.target_amount,
            goal_timeframe: newMainGoal.target_date ? Math.ceil((new Date(newMainGoal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : 12
          }
          localStorage.setItem('userFinancialGoal', JSON.stringify(mainGoalData))
          console.log('Nueva meta principal establecida:', newMainGoal.name)
        }
      }
      
      await refreshGoalsData()
      loadMainGoal()
      
    } catch (err) {
      console.error('Error eliminando meta:', err)
      setError('Error al eliminar la meta. Intente nuevamente.')
    }
  }

  const handleContribute = (goal) => {
    setSelectedGoal(goal)
    setContributeAmount('')
    setFormattedContributeAmount('')
    setContributionDate('')
    setShowContributeForm(true)
  }

  const handleSetAsMain = async (goal) => {
    if (!window.confirm(`¿Estás seguro de establecer "${goal.name}" como meta principal?`)) {
      return
    }
    
    try {
      setError(null)
      
      await apiService.goals.setAsMain(goal.id)
      
      const mainGoalData = {
        goal_type: goal.category.toLowerCase().replace(/\s+/g, '_'),
        goal_name: goal.name,
        goal_amount: goal.target_amount,
        goal_timeframe: goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : 12
      }
      localStorage.setItem('userFinancialGoal', JSON.stringify(mainGoalData))
      localStorage.setItem('mainGoalId', goal.id)
      
      console.log('Meta principal cambiada a:', goal.name)
      
      await refreshGoalsData()
      loadMainGoal()
      
    } catch (err) {
      console.error('Error cambiando meta principal:', err)
      setError('Error al cambiar la meta principal. Intente nuevamente.')
    }
  }

  const onSubmitContribution = async (data) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setValidationErrors({})
      
      const amount = parseAmount(formattedContributeAmount)
      const remainingAmount = selectedGoal.target_amount - selectedGoal.current_amount
      
      const errors = {}
      
      if (!amount || amount <= 0) {
        errors.amount = 'El monto debe ser mayor a 0'
      }
      
      if (amount > remainingAmount) {
        errors.amount = `El monto no puede superar el monto restante (${formatCurrency(remainingAmount)})`
      }
      
      if (amount > globalBalance) {
        errors.amount = `Saldo insuficiente. Disponible: ${formatCurrency(globalBalance)}`
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setError('Por favor corrige los errores en el formulario antes de continuar')
        setIsSubmitting(false)
        return
      }
      
      console.log(`Abonando ${formatCurrency(amount)} a la meta: ${selectedGoal.name}`)
      
      try {
        const contributionData = {
          amount: amount,
          description: `Abono a meta: ${selectedGoal.name}`
        }
        
        if (contributionDate) {
          contributionData.contribution_date = contributionDate
        }
        
        await apiService.goals.contribute(selectedGoal.id, contributionData)
        console.log('Abono realizado exitosamente')
        
        setError(null)
        
      } catch (apiError) {
        console.error('Error en API al abonar:', apiError)
        
        if (apiError.response?.status === 422) {
          const backendErrors = apiError.response.data?.detail || {}
          setValidationErrors(backendErrors)
          setError('Por favor corrige los errores en el formulario')
          return
        }
        
        const errorMessage = apiError.response?.data?.detail || apiError.message || 'Error al realizar el abono'
        setError(errorMessage)
        return
      }
      
      setShowContributeForm(false)
      setSelectedGoal(null)
      setContributeAmount('')
      setFormattedContributeAmount('')
      setContributionDate('')
      await refreshGoalsData()
      loadMainGoal()
      
      await refreshBalance()
      
    } catch (err) {
      console.error('Error realizando abono:', err)
      setError('Error al realizar el abono. Intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log('Goals - useEffect ya ejecutado, saltando carga duplicada')
      return
    }
    
    hasLoadedRef.current = true
    console.log('Goals - Iniciando carga de datos (primera vez)')
    
    loadData()
    loadMainGoal()
  }, [])

  return {
    // Estados
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
    
    // Categorías
    goalCategories,
    
    // Form
    register,
    handleSubmit,
    errors,
    
    // Funciones de utilidad
    formatAmount,
    parseAmount,
    handleAmountChange,
    formatMonthName,
    getGoalDisplayName,
    getProgressColor,
    getAllGoals,
    
    // Handlers
    onSubmit,
    handleEdit,
    handleDelete,
    handleContribute,
    handleSetAsMain,
    onSubmitContribution,
    handleGoalChangeForChart,
    handleMonthYearChange,
    handleSavingsMonthsChange,
    
    // Setters
    setShowAddForm,
    setShowContributeForm,
    setFormattedTargetAmount,
    setFormattedContributeAmount,
    setContributeAmount,
    setContributionDate
  }
}

