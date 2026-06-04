import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'

export const useDashboardExpenses = () => {
  const [loading, setLoading] = useState(true)
  const [expenseCategories, setExpenseCategories] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadExpenseCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const currentDate = new Date()
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        
        // Obtener rango del mes actual
        const start = new Date(year, month - 1, 1)
        const end = new Date(year, month, 0)
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
        
        const categories = await apiService.reports.getExpenseCategories(startStr, endStr)
        const categoriesData = categories?.categories || []
        setExpenseCategories(categoriesData)
      } catch (err) {
        setError(err.message)
        console.error('Error cargando categorías de gastos:', err)
        setExpenseCategories([])
      } finally {
        setLoading(false)
      }
    }

    loadExpenseCategories()
  }, [])

  return {
    loading,
    expenseCategories,
    error
  }
}

