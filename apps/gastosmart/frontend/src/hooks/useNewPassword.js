import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

/**
 * Hook personalizado para manejar toda la lógica de NewPassword
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useNewPassword = () => {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  // Estados de validación de contraseña
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })

  const navigate = useNavigate()
  const location = useLocation()

  // Verificar que el código fue verificado
  useEffect(() => {
    const emailFromState = location.state?.email
    const emailFromStorage = localStorage.getItem('resetEmail')
    const codeVerified = localStorage.getItem('codeVerified')
    
    // Si no hay email o no se verificó el código, redirigir
    if (!emailFromStorage || codeVerified !== 'true') {
      navigate('/password-reset')
      return
    }
    
    setEmail(emailFromState || emailFromStorage)
  }, [location, navigate])

  // Validar contraseña en tiempo real
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /(?=.*[A-Z])/.test(password),
      lowercase: /(?=.*[a-z])/.test(password),
      number: /(?=.*\d|[!@#$%^&*(),.?":{}|<>])/.test(password)
    }
    setPasswordRequirements(requirements)
    return Object.values(requirements).every(req => req === true)
  }

  // Manejo de cambio de contraseña
  const handlePasswordChange = (e) => {
    const password = e.target.value
    setNewPassword(password)
    validatePassword(password)
    setError('')
  }

  // Verificar si todas las validaciones pasan
  const allRequirementsMet = Object.values(passwordRequirements).every(req => req === true) && newPassword.length > 0

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!newPassword) {
      setError('Por favor, ingresa una nueva contraseña')
      return
    }

    if (!confirmPassword) {
      setError('Por favor, confirma tu nueva contraseña')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (!validatePassword(newPassword)) {
      setError('La contraseña no cumple con todos los requisitos de seguridad')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setLoading(true)

      // Actualizar la contraseña usando authService
      await authService.resetPassword(email, newPassword)

      // Limpiar datos del localStorage
      localStorage.removeItem('resetEmail')
      localStorage.removeItem('codeVerified')
      
      // Mostrar mensaje de éxito en pantalla
      setSuccess('¡Contraseña actualizada exitosamente!')
      setRedirecting(true)
      
      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión.' },
          replace: true
        })
      }, 1500)

    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return {
    // Estados
    email,
    newPassword,
    confirmPassword,
    error,
    success,
    loading,
    showNewPassword,
    showConfirmPassword,
    redirecting,
    passwordRequirements,
    allRequirementsMet,
    
    // Handlers
    handlePasswordChange,
    handleSubmit,
    setNewPassword,
    setConfirmPassword,
    setShowNewPassword,
    setShowConfirmPassword
  }
}

