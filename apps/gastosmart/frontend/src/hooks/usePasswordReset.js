import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

/**
 * Hook personalizado para manejar toda la lógica de PasswordReset
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const usePasswordReset = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')
  
  const navigate = useNavigate()

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldError('')

    // Validaciones
    if (!email.trim()) {
      setFieldError('El correo electrónico es obligatorio')
      setError('Por favor, ingresa tu correo electrónico')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setFieldError('El formato del correo electrónico no es válido')
      setError('Por favor, ingresa un correo electrónico válido')
      return
    }

    try {
      setLoading(true)

      // Enviar código de verificación usando authService
      await authService.sendVerificationCode(email, 'password_recovery')

      // Guardar email en localStorage
      localStorage.setItem('resetEmail', email)

      // Redirigir a la página de verificación de código
      setTimeout(() => {
        navigate('/verify-recovery-code', { state: { email } })
      }, 1000)

    } catch (err) {
      setError(err.message || 'Error al enviar el código de verificación')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setError('')
    setFieldError('')
  }

  return {
    // Estados
    email,
    error,
    loading,
    fieldError,
    
    // Handlers
    handleEmailChange,
    handleSubmit
  }
}

