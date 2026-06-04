import { useState, useEffect, useRef } from 'react'
import { apiService } from '../services/apiService'

/**
 * Hook personalizado para manejar la lógica de la meta principal
 * Separa la lógica de negocio del componente de presentación
 */
export const useMainGoal = () => {
  const [goalData, setGoalData] = useState(null)
  const [mainGoalFromBackend, setMainGoalFromBackend] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Ref para evitar ejecuciones duplicadas en StrictMode
  const hasLoadedRef = useRef(false)

  // Obtener la meta principal desde el backend
  const fetchMainGoalFromBackend = async () => {
    try {
      const goalsResponse = await apiService.goals.getGoals()
      const mainGoal = goalsResponse.find(goal => goal.is_main === true)
      
      if (mainGoal) {
        console.log('Dashboard - Meta principal desde backend:', mainGoal)
        setMainGoalFromBackend(mainGoal)
        return mainGoal
      }
      return null
    } catch (error) {
      console.error('Dashboard - Error obteniendo meta principal del backend:', error)
      return null
    }
  }

  // Obtener la meta financiera del localStorage y sincronizar con backend
  useEffect(() => {
    // Protección contra React.StrictMode (evita ejecuciones duplicadas)
    if (hasLoadedRef.current) {
      console.log('Dashboard - useEffect ya ejecutado, saltando carga duplicada')
      return
    }
    
    hasLoadedRef.current = true
    console.log('Dashboard - Iniciando carga de datos (primera vez)')
    
    const loadGoalData = async () => {
      try {
        setLoading(true)
        const storedGoal = localStorage.getItem('userFinancialGoal')
        let mainGoalId = localStorage.getItem('mainGoalId')
        
        console.log('Dashboard - Cargando meta principal:', { storedGoal: !!storedGoal, mainGoalId })
        
        // Primero intentar obtener desde el backend
        const backendGoal = await fetchMainGoalFromBackend()
        
        if (backendGoal) {
          // Si existe en el backend, usarla como fuente de verdad
          setGoalData({
            goal_name: backendGoal.name,
            goal_type: backendGoal.category,
            goal_amount: backendGoal.target_amount,
            current_amount: backendGoal.current_amount,
            progress_percentage: backendGoal.progress_percentage,
            goal_timeframe: backendGoal.target_date ? 
              Math.ceil((new Date(backendGoal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : null,
            id: backendGoal.id,
            backend_id: backendGoal.id
          })
        } else if (storedGoal && storedGoal !== 'null' && storedGoal !== 'undefined') {
          // Fallback a localStorage si no hay en backend
          const parsedGoal = JSON.parse(storedGoal)
          console.log('Dashboard - Meta principal parseada desde localStorage:', { goal_type: parsedGoal.goal_type, goal_amount: parsedGoal.goal_amount })
          
          // Validar que la meta tenga los campos necesarios
          if (parsedGoal.goal_type && parsedGoal.goal_amount) {
            // Lectura inteligente del ID: usar el del objeto si no existe mainGoalId
            if (!mainGoalId && parsedGoal.id) {
              mainGoalId = parsedGoal.id
              console.log('Dashboard - Usando ID del objeto meta:', mainGoalId)
            }
            
            // Agregar el ID del backend si existe
            if (mainGoalId) {
              parsedGoal.backend_id = mainGoalId
            }
            
            setGoalData(parsedGoal)
            console.log('Dashboard - Meta principal cargada exitosamente desde localStorage')
          } else {
            console.warn('Dashboard - Meta principal incompleta:', parsedGoal)
            setGoalData(null)
          }
        } else {
          console.error('Dashboard - No se encontró meta principal válida')
          setGoalData(null)
        }
      } catch (error) {
        console.error('Dashboard - Error cargando meta principal:', error)
        setGoalData(null)
      } finally {
        setLoading(false)
      }
    }
    
    // Cargar inmediatamente
    loadGoalData()
    
    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'userFinancialGoal' || e.key === 'mainGoalId') {
        console.log('Dashboard - Cambio detectado en localStorage:', e.key)
        loadGoalData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Recargar cada 30 segundos para sincronizar con backend
    const interval = setInterval(() => {
      console.log('Dashboard - Recargando meta principal (sincronización automática)')
      loadGoalData()
    }, 30000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Mapear nombres de metas a textos legibles
  const getGoalDisplayName = (goalType) => {
    const goalNames = {
      'emergencia': 'Fondo de Emergencia',
      'viaje': 'Vacaciones',
      'casa': 'Comprar Casa',
      'educacion': 'Educación',
      'Educación': 'Educación',
      'other': goalData?.goal_name || 'Meta Personalizada'
    }
    return goalNames[goalType] || goalType
  }

  // Calcular valores derivados
  const currentAmount = goalData?.current_amount || 0
  const targetAmount = goalData?.goal_amount || 0
  const progressPercentage = goalData?.progress_percentage || (targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0)
  const remainingAmount = targetAmount - currentAmount

  return {
    goalData,
    loading,
    getGoalDisplayName,
    currentAmount,
    targetAmount,
    progressPercentage,
    remainingAmount
  }
}

