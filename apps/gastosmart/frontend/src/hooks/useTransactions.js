import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { apiService } from '../services/apiService'
import { useBalance } from '../contexts/BalanceContext'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook personalizado para manejar la lógica de transacciones (ingresos y gastos)
 * Separa toda la lógica de negocio del componente de presentación
 */
export const useTransactions = () => {
  const { balance: globalBalance, refreshBalance } = useBalance()
  const { user } = useAuth()
  const [incomeTransactions, setIncomeTransactions] = useState([])
  const [expenseTransactions, setExpenseTransactions] = useState([])
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [transactionType, setTransactionType] = useState('income')
  const [amountValue, setAmountValue] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm()

  // Income categories matching the prototype
  const incomeCategories = [
    'Salario',
    'Freelance', 
    'Inversiones',
    'Ventas',
    'Bonificaciones',
    'Otros ingresos'
  ]

  // Expense categories matching the prototype
  const expenseCategories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Servicios',
    'Otros gastos'
  ]

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Función para formatear números con separador de miles (formato colombiano)
  const formatNumberWithThousands = (value) => {
    if (!value) return ''
    
    // Remover todo excepto números y coma decimal
    let numericValue = value.toString().replace(/[^\d,]/g, '')
    
    // Si hay más de una coma, mantener solo la última
    const commaCount = (numericValue.match(/,/g) || []).length
    if (commaCount > 1) {
      const lastCommaIndex = numericValue.lastIndexOf(',')
      numericValue = numericValue.substring(0, lastCommaIndex).replace(/,/g, '') + numericValue.substring(lastCommaIndex)
    }
    
    // Separar parte entera y decimal
    const parts = numericValue.split(',')
    
    // Formatear parte entera con separador de miles (punto)
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    
    // Reunir las partes (máximo 2 decimales)
    if (parts.length > 1) {
      return parts[0] + ',' + parts[1].slice(0, 2)
    }
    
    return parts[0] || ''
  }

  // Función para convertir valor formateado a número
  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return 0
    // Remover separadores de miles (puntos) y cambiar coma decimal por punto
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.')) || 0
  }

  // Manejar cambios en el campo de monto
  const handleAmountChange = (e) => {
    const inputValue = e.target.value
    const formattedValue = formatNumberWithThousands(inputValue)
    
    // Validar que no exceda el máximo permitido
    const parsedValue = parseFormattedNumber(formattedValue)
    const MAX_AMOUNT = 1000000000 // 1.000.000.000 (mil millones)
    
    if (parsedValue > MAX_AMOUNT) {
      // Limitar al máximo permitido
      const maxFormatted = formatNumberWithThousands(MAX_AMOUNT.toString())
      setAmountValue(maxFormatted)
      setValue('amount', MAX_AMOUNT)
    } else {
      setAmountValue(formattedValue)
      setValue('amount', parsedValue)
    }
  }

  // Calcular balance mensual actual basado solo en transacciones del mes actual
  const calculateCurrentBalance = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    // Filtrar transacciones del mes actual
    const currentMonthIncomes = incomeTransactions
      .filter(transaction => {
        if (!transaction.date) return false
        const transactionDate = new Date(transaction.date)
        return transactionDate.getFullYear() === currentYear &&
               transactionDate.getMonth() === currentMonth
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    
    const currentMonthExpenses = expenseTransactions
      .filter(transaction => {
        if (!transaction.date) return false
        const transactionDate = new Date(transaction.date)
        return transactionDate.getFullYear() === currentYear &&
               transactionDate.getMonth() === currentMonth
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    
    // Obtener información del usuario para verificar presupuesto
    const userBudget = user?.initial_budget || 0
    const budgetConfigured = user?.budget_configured || false
    const registrationDate = user?.registration_date ? new Date(user.registration_date) : new Date()
    
    // Verificar si el mes actual tiene presupuesto configurado
    const reportMonth = new Date(currentYear, currentMonth, 1)
    const registrationMonth = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1)
    const monthHasBudget = budgetConfigured && reportMonth >= registrationMonth
    
    // Calcular balance: si el mes tiene presupuesto configurado, incluir presupuesto (salario)
    // Si no tiene presupuesto configurado (meses anteriores), solo usar ingresos - gastos
    if (monthHasBudget) {
      // Balance = presupuesto (salario) + ingresos del mes - gastos del mes
      return userBudget + currentMonthIncomes - currentMonthExpenses
    } else {
      // Balance = solo ingresos del mes - gastos del mes (meses anteriores sin presupuesto configurado)
      return currentMonthIncomes - currentMonthExpenses
    }
  }

  // Función auxiliar para verificar si una transacción pertenece al mes actual
  const isCurrentMonth = (transactionDate) => {
    if (!transactionDate) return false
    const transactionDateObj = new Date(transactionDate)
    const currentDate = new Date()
    
    return transactionDateObj.getFullYear() === currentDate.getFullYear() &&
           transactionDateObj.getMonth() === currentDate.getMonth()
  }

  // Calcular el total de gastos basado en las transacciones del mes actual
  // Nota: expenseTransactions ya está filtrado por mes actual en loadData(), pero
  // aplicamos un filtro adicional por seguridad
  const calculateTotalExpenses = () => {
    return expenseTransactions
      .filter(transaction => isCurrentMonth(transaction.date))
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }

  // Calcular el total de ingresos basado en las transacciones del mes actual
  // Nota: incomeTransactions ya está filtrado por mes actual en loadData(), pero
  // aplicamos un filtro adicional por seguridad
  const calculateTotalIncome = () => {
    return incomeTransactions
      .filter(transaction => isCurrentMonth(transaction.date))
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // Crear fechas para el período mensual actual
      const dateFrom = new Date(year, month - 1, 1) // Primer día del mes
      const dateTo = new Date(year, month, 0) // Último día del mes
      
      const [stats, transactions] = await Promise.all([
        apiService.transactions.getStats(dateFrom.toISOString(), dateTo.toISOString()),
        apiService.transactions.getTransactions({ 
          limit: 50,
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString()
        })
      ])
      
      setMonthlySummary(stats)
      
      // Asegurar que transactions sea un array
      const transactionsArray = Array.isArray(transactions) ? transactions : []
      
      // Filtrar transacciones del mes actual (doble verificación por si el backend no filtra correctamente)
      const currentMonthTransactions = transactionsArray.filter(t => isCurrentMonth(t.date))
      
      // Separar por tipo
      const incomes = currentMonthTransactions.filter(t => t.type === 'income')
      const expenses = currentMonthTransactions.filter(t => t.type === 'expense')
      
      setIncomeTransactions(incomes)
      setExpenseTransactions(expenses)
      
    } catch (err) {
      setError(err.message)
      console.error('Error cargando transacciones:', err)
      setIncomeTransactions([])
      setExpenseTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setError(null)
      
      // Validar que el monto sea válido
      const parsedAmount = parseFormattedNumber(amountValue)
      if (!parsedAmount || parsedAmount <= 0) {
        setError('El monto debe ser mayor a 0')
        setSaving(false)
        return
      }
      
      // Validar que el monto no exceda el máximo permitido
      const MAX_AMOUNT = 1000000000 // 1.000.000.000 (mil millones)
      if (parsedAmount > MAX_AMOUNT) {
        setError(`El monto no puede exceder ${formatCurrency(MAX_AMOUNT)}`)
        setSaving(false)
        return
      }
      
      // Validar que la fecha no sea futura
      if (data.date) {
        const selectedDate = new Date(data.date)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // Permitir hasta el final del día de hoy
        
        if (selectedDate > today) {
          setError('La fecha no puede ser futura. Solo se permiten fechas actuales o anteriores.')
          setSaving(false)
          return
        }
      }
      
      // Actualizar el valor del campo hidden para validación
      setValue('amount', parsedAmount)
      
      const transactionData = {
        type: transactionType,
        amount: parsedAmount,
        category: data.category,
        description: data.description || '',
        date: new Date(data.date).toISOString()
      }
      
      console.log('Guardando transacción:', transactionData)
      
      // Guardar la transacción
      if (editingTransaction) {
        await apiService.transactions.update(editingTransaction.id, transactionData)
      } else {
        await apiService.transactions.create(transactionData)
      }
      
      // Cerrar el formulario inmediatamente para mejorar la experiencia del usuario
      setShowAddForm(false)
      setEditingTransaction(null)
      setAmountValue('') // Limpiar el valor formateado
      reset()
      
      // Recargar datos después de cerrar el formulario
      await loadData()
      
      // Refrescar saldo global
      await refreshBalance()
      
    } catch (err) {
      console.error('Error guardando transacción:', err)
      setError(err.message || 'Error al guardar la transacción. Intente nuevamente.')
      // Mantener el formulario abierto en caso de error
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setTransactionType(transaction.type)
    const formattedAmount = formatNumberWithThousands(transaction.amount.toString())
    setAmountValue(formattedAmount)
    setValue('amount', transaction.amount)
    setValue('category', transaction.category)
    setValue('description', transaction.description || '')
    setValue('date', format(new Date(transaction.date), 'yyyy-MM-dd'))
    setShowAddForm(true)
  }

  const handleDelete = async (transactionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      return
    }
    
    try {
      setError(null)
      await apiService.transactions.delete(transactionId)
      await loadData()
      
      // Refrescar saldo global
      await refreshBalance()
    } catch (err) {
      setError(err.message)
      console.error('Error eliminando transacción:', err)
    }
  }

  const handleCancel = () => {
    reset()
    setAmountValue('')
    setShowAddForm(false)
    setEditingTransaction(null)
    setError(null)
  }

  const openAddForm = (type) => {
    setTransactionType(type)
    setShowAddForm(true)
    setEditingTransaction(null)
    setAmountValue('')
    reset()
  }

  return {
    // Estados
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
    
    // Categorías
    incomeCategories,
    expenseCategories,
    
    // Form
    register,
    handleSubmit,
    errors,
    
    // Funciones de cálculo
    calculateCurrentBalance,
    calculateTotalExpenses,
    calculateTotalIncome,
    
    // Handlers
    handleAmountChange,
    onSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    openAddForm,
    
    // Funciones de utilidad
    formatNumberWithThousands,
    parseFormattedNumber
  }
}

