import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

/**
 * Hook personalizado para manejar toda la lógica de VerifyRegistrationCode
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useVerifyRegistrationCode = () => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos en segundos
  const [canResend, setCanResend] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [redirecting, setRedirecting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Obtener email del state o localStorage
    const emailFromState = location.state?.email
    const emailFromStorage = localStorage.getItem('registrationEmail')
    const userEmail = emailFromState || emailFromStorage
    
    if (!userEmail) {
      navigate('/signup')
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

  // Timer para reenvío de código (60 segundos)
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

  const handleResendCode = async () => {
    if (!email || !canResend) return

    try {
      setLoading(true)
      await authService.sendVerificationCode(email, 'registration')
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    console.log('Iniciando verificación con código:', code)
    
    // Validaciones del formulario
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

    if (!email) {
      setError('Email no encontrado. Por favor regístrate de nuevo.')
      return false
    }

    setLoading(true)

    try {
      // Usar authService que maneja la configuración correcta de URLs
      await authService.verifyCode(email, code, 'registration')
      
      // Limpiar email de localStorage
      localStorage.removeItem('registrationEmail')
      
      // Redirigir inmediatamente
      navigate('/login', { 
        state: { message: '¡Cuenta verificada! Ahora puedes iniciar sesión.' },
        replace: true
      })
    } catch (err) {
      setLoading(false)
      
      let errorMessage = 'Error al verificar el código'
      
      console.log('Error completo:', err)
      console.log('Error message:', err.message)
      
      // Manejar diferentes tipos de errores
      if (err.message.includes('incorrecto') || err.message.includes('incorrect')) {
        if (err.message.includes('quedan') && err.message.includes('intentos')) {
          errorMessage = err.message
        } else {
          errorMessage = 'Código incorrecto. Verifica los números ingresados'
        }
      } else if (err.message.includes('invalid') || err.message.includes('inválido')) {
        errorMessage = 'Código inválido. Verifica los números ingresados'
      } else if (err.message.includes('expired') || err.message.includes('expirado')) {
        errorMessage = 'Código expirado. Solicita uno nuevo'
      } else if (err.message.includes('máximo de intentos') || err.message.includes('maximum attempts')) {
        errorMessage = 'Máximo de intentos alcanzado. Solicita un nuevo código'
      } else if (err.message.includes('network') || err.message.includes('conexión')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.log('Mensaje de error final:', errorMessage)
      setError(errorMessage)
    }
    
    return false
  }

  const handleCodeChange = (value) => {
    const val = value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    if (error) {
      setError('')
      console.log('Error limpiado al escribir')
    }
  }

  return {
    // Estados
    code,
    error,
    loading,
    email,
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

