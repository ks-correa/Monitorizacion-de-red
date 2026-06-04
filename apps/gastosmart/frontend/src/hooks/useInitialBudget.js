import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook personalizado para manejar toda la lógica de InitialBudget
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useInitialBudget = () => {
  const { user, updateUserBudget } = useAuth()
  const navigate = useNavigate()

  // Estados del formulario
  const [incomeAmount, setIncomeAmount] = useState('')
  const [payFrequency, setPayFrequency] = useState('mensual')
  const [selectedGoal, setSelectedGoal] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalTimeframe, setGoalTimeframe] = useState('')
  const [customTimeframe, setCustomTimeframe] = useState('')
  const [otherGoalName, setOtherGoalName] = useState('')
  const [otherGoalAmount, setOtherGoalAmount] = useState('')
  const [otherGoalTimeframe, setOtherGoalTimeframe] = useState('')
  const [otherCustomTimeframe, setOtherCustomTimeframe] = useState('')
  
  // Nuevos estados para el formulario unificado
  const [goalName, setGoalName] = useState('')
  const [goalCategory, setGoalCategory] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [description, setDescription] = useState('')

  // Estados de UI
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtherGoalForm, setShowOtherGoalForm] = useState(false)

  // Verificar autenticación y configuración previa
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Verificar si ya tiene presupuesto configurado (más de $2,000,000 COP indica configuración real)
    if (user.budget_configured === true || 
        (user.initial_budget && user.initial_budget > 2000000)) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Formatear número con puntos de miles
  const formatNumberWithThousands = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Parsear número formateado
  const parseFormattedNumber = (formattedString) => {
    return parseInt(formattedString.replace(/\./g, '')) || 0
  }

  // Función para obtener el nombre de la meta
  const getGoalDisplayName = (goalType) => {
    const goalNames = {
      'emergencia': 'Fondo de Emergencia',
      'viaje': 'Viajes',
      'casa': 'Vivienda',
      'educacion': 'Educación',
      'vehiculo': 'Vehículo',
      'ahorros': 'Ahorros',
      'inversiones': 'Inversiones',
      'tecnologia': 'Tecnología',
      'salud': 'Salud',
      'boda': 'Boda',
      'jubilacion': 'Jubilación',
      'other': otherGoalName || 'Otra Meta'
    }
    return goalNames[goalType] || goalType
  }

  // Función para obtener la fecha objetivo
  const getTargetDate = () => {
    if (targetDate) return targetDate
    
    // Si no hay fecha específica, calcular basado en el timeframe
    const timeframe = selectedGoal === 'other' ? otherGoalTimeframe : goalTimeframe
    if (timeframe && timeframe !== 'custom') {
      const months = parseInt(timeframe)
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + months)
      return futureDate.toISOString().split('T')[0]
    } else if (timeframe === 'custom') {
      const customMonths = parseInt(selectedGoal === 'other' ? otherCustomTimeframe : customTimeframe)
      if (customMonths) {
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + customMonths)
        return futureDate.toISOString().split('T')[0]
      }
    }
    return ''
  }

  // Función para obtener la descripción
  const getDescription = () => {
    return description
  }

  // Formatear input de moneda
  const handleCurrencyInput = (value) => {
    let cleanValue = value.replace(/[^\d]/g, '')
    if (cleanValue.length > 12) {
      cleanValue = cleanValue.substring(0, 12)
    }
    return cleanValue ? formatNumberWithThousands(parseInt(cleanValue)) : ''
  }

  // Manejo de cambio de ingreso
  const handleIncomeChange = (e) => {
    const formatted = handleCurrencyInput(e.target.value)
    setIncomeAmount(formatted)
    setError('')
  }

  // Manejo de cambio de meta
  const handleGoalChange = (goal) => {
    setSelectedGoal(goal)
    setGoalCategory(goal)
    setShowOtherGoalForm(goal === 'other')
    setError('')
    
    // NO cambiar el nombre automáticamente - el usuario ya lo escribió
    // Solo limpiar si es la primera vez o si cambia a "other"
    if (goal === 'other' && !otherGoalName) {
      setGoalName('')
    }
    
    // Limpiar campos
    if (goal === 'other') {
      setGoalAmount('')
      setGoalTimeframe('')
      setCustomTimeframe('')
    } else {
      setOtherGoalName('')
      setOtherGoalAmount('')
      setOtherGoalTimeframe('')
      setOtherCustomTimeframe('')
    }
    
    // Limpiar campos adicionales
    setTargetDate('')
    setDescription('')
  }

  // Validación completa del formulario
  const validateForm = () => {
    const errors = []
    const income = parseFormattedNumber(incomeAmount)

    // Validar salario
    if (!income || income <= 0) {
      errors.push('Ingresa un salario válido')
    } else if (income < 100000) {
      errors.push('El salario mínimo debe ser mayor a $100,000 COP')
    }

    // Validar frecuencia de pago
    if (!payFrequency) {
      errors.push('Selecciona una frecuencia de pago')
    }

    // Validar nombre de la meta
    const finalGoalName = selectedGoal === 'other' ? otherGoalName : goalName
    if (!finalGoalName || !finalGoalName.trim()) {
      errors.push('Ingresa el nombre de tu meta')
    } else if (finalGoalName.trim().length < 3) {
      errors.push('El nombre de la meta debe tener al menos 3 caracteres')
    } else if (finalGoalName.trim().length > 100) {
      errors.push('El nombre de la meta no puede exceder 100 caracteres')
    }

    // Validar categoría
    if (!selectedGoal) {
      errors.push('Selecciona una categoría para tu meta')
    }

    // Validar monto objetivo
    const finalGoalAmount = selectedGoal === 'other' ? otherGoalAmount : goalAmount
    const amount = parseFormattedNumber(finalGoalAmount)
    if (!amount || amount <= 0) {
      errors.push('Ingresa un monto objetivo válido')
    } else if (amount < 100000) {
      errors.push('El monto objetivo debe ser mayor a $100,000 COP')
    } else if (amount > 1000000000) {
      errors.push('El monto objetivo no puede exceder $1,000,000,000 COP')
    }

    // Validar fecha objetivo (opcional pero si se proporciona debe ser válida)
    if (targetDate) {
      const selectedDate = new Date(targetDate)
      const today = new Date()
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 10)
      
      if (selectedDate <= today) {
        errors.push('La fecha objetivo debe ser futura')
      } else if (selectedDate > maxDate) {
        errors.push('La fecha objetivo no puede ser mayor a 10 años')
      }
    }

    // Validar descripción (opcional pero si se proporciona debe ser válida)
    if (description && description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres')
    }

    return errors
  }

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    console.log('Formulario enviado')
    console.log('Usuario actual:', user)

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      console.log('Errores de validación:', validationErrors)
      setError(validationErrors.join('. '))
      return
    }

    try {
      setLoading(true)
      const income = parseFormattedNumber(incomeAmount)
      console.log('Datos del formulario:', { income, payFrequency, selectedGoal })

      // Guardar meta financiera en localStorage
      const finalGoalName = selectedGoal === 'other' ? otherGoalName : goalName
      const finalGoalAmount = selectedGoal === 'other' ? otherGoalAmount : goalAmount
      
      const goalData = {
        goal_type: selectedGoal,
        goal_name: finalGoalName,
        goal_amount: parseFormattedNumber(finalGoalAmount),
        goal_timeframe: 12 // Valor por defecto, ya no es obligatorio
      }

      console.log('Guardando meta principal en localStorage:', goalData)
      localStorage.setItem('userFinancialGoal', JSON.stringify(goalData))
      
      // Verificar que se guardó correctamente
      const savedGoal = localStorage.getItem('userFinancialGoal')
      console.log('Meta guardada y verificada:', savedGoal)
      
      if (!savedGoal) {
        throw new Error('Error al guardar la meta principal en localStorage')
      }

      // Actualizar presupuesto en el backend
      console.log('Llamando a updateUserBudget...')
      console.log('Datos a enviar:', { income, payFrequency, userId: user?.id })
      const updatedUser = await updateUserBudget(income, payFrequency)
      
      console.log('Presupuesto actualizado:', updatedUser)

      // Crear meta principal en el backend
      console.log('Creando meta principal en el backend...')
      let mainGoalId = null
      
      try {
        const { apiService } = await import('../services/apiService')
        const mainGoalData = {
          name: goalData.goal_name,
          target_amount: goalData.goal_amount,
          category: getGoalDisplayName(selectedGoal),
          description: description || '',
          target_date: targetDate || null,
          current_amount: 0,
          progress_percentage: 0,
          is_main: true
        }
        
        const createdGoal = await apiService.goals.create(mainGoalData)
        console.log('Meta principal creada en backend:', createdGoal)
        
        // Obtener el ID de la meta creada en el backend
        mainGoalId = createdGoal._id || createdGoal.id
        console.log('ID de meta principal obtenido del backend:', mainGoalId)
        
      } catch (goalError) {
        console.warn('Error creando meta principal en backend:', goalError)
        // Generar un ID temporal para modo demo
        mainGoalId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        console.log('Usando ID temporal para modo demo:', mainGoalId)
      }
      
      // Siempre guardar el ID (del backend o temporal)
      localStorage.setItem('mainGoalId', mainGoalId)
      console.log('Meta principal guardada en localStorage:', mainGoalId)
      
      // Actualizar la meta en localStorage con el ID
      const updatedGoalData = {
        ...goalData,
        id: mainGoalId,
        backend_id: mainGoalId
      }
      localStorage.setItem('userFinancialGoal', JSON.stringify(updatedGoalData))
      console.log('Meta principal actualizada con ID:', updatedGoalData)

      // Verificación final antes de redirigir
      const finalGoalCheck = localStorage.getItem('userFinancialGoal')
      const finalIdCheck = localStorage.getItem('mainGoalId')
      
      console.log('Verificación final antes de redirigir:')
      console.log('userFinancialGoal:', finalGoalCheck)
      console.log('mainGoalId:', finalIdCheck)
      
      if (!finalGoalCheck || finalGoalCheck === 'null') {
        console.error('Error crítico: Meta principal no encontrada antes de redirigir')
        throw new Error('Error al configurar la meta principal. Intente nuevamente.')
      }

      // Redirigir al dashboard inmediatamente
      console.log('Redirigiendo al dashboard...')
      navigate('/dashboard', { replace: true })

    } catch (err) {
      console.error('Error al configurar presupuesto:', err)
      setError(err.message || 'Error al configurar el presupuesto')
    } finally {
      setLoading(false)
    }
  }

  return {
    // Estados
    incomeAmount,
    payFrequency,
    selectedGoal,
    goalAmount,
    goalTimeframe,
    customTimeframe,
    otherGoalName,
    otherGoalAmount,
    otherGoalTimeframe,
    otherCustomTimeframe,
    goalName,
    goalCategory,
    targetDate,
    description,
    error,
    loading,
    showOtherGoalForm,
    
    // Funciones de utilidad
    formatNumberWithThousands,
    parseFormattedNumber,
    getGoalDisplayName,
    getTargetDate,
    getDescription,
    handleCurrencyInput,
    
    // Handlers
    handleIncomeChange,
    handleGoalChange,
    handleSubmit,
    
    // Setters
    setIncomeAmount,
    setPayFrequency,
    setGoalAmount,
    setGoalTimeframe,
    setCustomTimeframe,
    setOtherGoalName,
    setOtherGoalAmount,
    setOtherGoalTimeframe,
    setOtherCustomTimeframe,
    setGoalName,
    setGoalCategory,
    setTargetDate,
    setDescription
  }
}

