import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

/**
 * Hook personalizado para manejar toda la lógica de VerifyRecoveryCode
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useVerifyRecoveryCode = () => {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos
  const [canResend, setCanResend] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [redirecting, setRedirecting] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

  // Inicializar email desde state o localStorage
  useEffect(() => {
    const emailFromState = location.state?.email
    const emailFromStorage = localStorage.getItem('resetEmail')
    const userEmail = emailFromState || emailFromStorage
    
    if (!userEmail) {
      navigate('/password-reset')
      return
    }
    setEmail(userEmail)
  }, [location, navigate])

  // Timer de expiración del código (10 minutos)
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft])

  // Timer de reenvío (60 segundos)
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true)
      return
    }
    
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [resendTimer])

  // Formatear tiempo (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Reenviar código
  const handleResendCode = async () => {
    if (!email || !canResend) return

    try {
      setLoading(true)
      await authService.sendVerificationCode(email, 'password_recovery')
      setError('')
      setTimeLeft(600) // Reiniciar timer de 10 minutos
      setResendTimer(60) // Nuevo timer de 60 segundos
      setCanResend(false)
      setCode('')
    } catch (err) {
      setError(err.message || 'Error al reenviar código')
    } finally {
      setLoading(false)
    }
  }

  // Verificar código
  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    // Validaciones
    if (!code) {
      setError('Por favor, ingresa el código de verificación')
      return false
    }
    
    if (code.length !== 6) {
      setError('El código debe tener exactamente 6 dígitos')
      return false
    }

    if (!/^\d{6}$/.test(code)) {
      setError('El código debe contener solo números')
      return false
    }
    
    if (timeLeft === 0) {
      setError('El código ha expirado. Por favor, solicita uno nuevo.')
      return false
    }

    setLoading(true)

    try {
      // Verificar código usando authService
      await authService.verifyCode(email, code, 'password_recovery')

      // Código verificado exitosamente, guardar flag y redirigir a nueva contraseña
      localStorage.setItem('codeVerified', 'true')
      setRedirecting(true)
      
      setTimeout(() => {
        navigate('/new-password', { 
          state: { email },
          replace: true
        })
      }, 800)

    } catch (err) {
      setLoading(false)
      setRedirecting(false)
      
      let errorMessage = err.message || 'Error de conexión con el servidor'
      
      // Si se acabaron los intentos
      if (errorMessage.includes('Máximo de intentos alcanzado')) {
        errorMessage = 'Máximo de intentos alcanzado. Haz clic en "Reenviar código" para obtener uno nuevo.'
      }
      
      setError(errorMessage)
    }
    
    return false
  }

  const handleCodeChange = (value) => {
    const val = value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    if (error) setError('')
  }

  return {
    // Estados
    code,
    email,
    error,
    loading,
    timeLeft,
    canResend,
    resendTimer,
    redirecting,
    
    // Handlers
    handleCodeChange,
    handleResendCode,
    handleSubmit,
    formatTime
  }
}

