import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config/config'

/**
 * Hook personalizado para manejar toda la lógica de Signup
 * Separa completamente la lógica de negocio del componente de presentación
 */
export const useSignup = () => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })
  
  // Estado de la UI
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [redirecting, setRedirecting] = useState(false)
  
  // Flags para prevenir que se limpien los errores (igual que en login)
  const hasActiveError = useRef(false)
  const isSubmitting = useRef(false)
  
  // Estados de validación de contraseña
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })

  const navigate = useNavigate()

  // ====== UTIL: registro seguro sin interceptores ======
  const safeRegister = async (userData) => {
    const api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      // IMPORTANTÍSIMO: no copiar interceptores globales
      // No agregamos api.interceptors.request/response aquí.
    })

    // Transform frontend field names to backend field names
    const backendData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
      initial_budget: 1000000, // Default budget (COP)
      budget_period: 'mensual' // Default period
    }

    const res = await api.post('/users/register', backendData)
    return res.data
  }

  // Protección de errores (igual que en login)
  const lastErrorRef = useRef(null)
  const lastFieldErrorsRef = useRef({})
  const isSettingErrorsRef = useRef(false)
  
  useEffect(() => {
    if (isSettingErrorsRef.current) return
    
    if (hasActiveError.current) {
      if (error) lastErrorRef.current = error
      if (Object.keys(fieldErrors).length > 0) {
        lastFieldErrorsRef.current = fieldErrors
      }
      
      if (Object.keys(fieldErrors).length === 0 && Object.keys(lastFieldErrorsRef.current).length > 0) {
        setFieldErrors(lastFieldErrorsRef.current)
      }
      
      if (!error && lastErrorRef.current) {
        setError(lastErrorRef.current)
      }
    }
  }, [error, fieldErrors])

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

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Limpiar errores cuando el usuario empieza a escribir (igual que en login)
    if (error) {
      setError('')
      hasActiveError.current = false
    }
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Validar contraseña en tiempo real
    if (name === 'password') {
      validatePassword(newValue)
      // También validar confirmPassword si ya tiene contenido
      if (formData.confirmPassword) {
        const errors = { ...fieldErrors }
        if (formData.confirmPassword !== newValue) {
          errors.confirmPassword = 'Las contraseñas no coinciden'
        } else {
          delete errors.confirmPassword
        }
        setFieldErrors(errors)
      }
    }
    
    // Validar confirmación de contraseña en tiempo real
    if (name === 'confirmPassword') {
      const errors = { ...fieldErrors }
      if (newValue && newValue !== formData.password) {
        errors[name] = 'Las contraseñas no coinciden'
      } else {
        delete errors[name]
      }
      setFieldErrors(errors)
    }
    
    // Validar campos de texto en tiempo real (nombre, apellido, email)
    if (['firstName', 'lastName', 'email'].includes(name) && newValue) {
      validateField(name, newValue, true)
    }
  }

  const handlePasswordToggle = (field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev)
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev)
    }
  }

  // Validaciones
  const validateField = (name, value, showRequiredError = true) => {
    const errors = { ...fieldErrors }
    
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value || !value.trim()) {
          if (showRequiredError) {
            errors[name] = 'Este campo es obligatorio'
          }
        } else if (value.trim().length < 2) {
          errors[name] = 'Debe tener al menos 2 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value.trim())) {
          errors[name] = 'Solo se permiten letras'
        } else {
          delete errors[name]
        }
        break
        
      case 'email':
        if (!value || !value.trim()) {
          if (showRequiredError) {
            errors[name] = 'Este campo es obligatorio'
          }
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors[name] = 'El formato del correo electrónico no es válido'
        } else if (value.trim().length > 100) {
          errors[name] = 'El correo es demasiado largo'
        } else {
          delete errors[name]
        }
        break
        
      case 'password':
        if (!value) {
          if (showRequiredError) {
            errors[name] = 'Este campo es obligatorio'
          }
        } else {
          const passwordErrors = []
          if (value.length < 8) passwordErrors.push('mínimo 8 caracteres')
          if (!/(?=.*[A-Z])/.test(value)) passwordErrors.push('una mayúscula')
          if (!/(?=.*[a-z])/.test(value)) passwordErrors.push('una minúscula')
          if (!/(?=.*\d|[!@#$%^&*(),.?":{}|<>])/.test(value)) passwordErrors.push('un número o símbolo')
          
          if (passwordErrors.length > 0) {
            errors[name] = `Debe contener: ${passwordErrors.join(', ')}`
          } else {
            delete errors[name]
          }
        }
        break
        
      case 'confirmPassword':
        if (!value) {
          if (showRequiredError) {
            errors[name] = 'Este campo es obligatorio'
          }
        } else if (value !== formData.password) {
          errors[name] = 'Las contraseñas no coinciden'
        } else {
          delete errors[name]
        }
        break
        
      case 'termsAccepted':
        if (!value) {
          errors[name] = 'Debes aceptar los términos y condiciones'
        } else {
          delete errors[name]
        }
        break
        
      default:
        break
    }
    
    setFieldErrors(errors)
    return !errors[name]
  }

  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
    const nextErrors = {}
    let valid = true

    // Validar campos requeridos
    fields.forEach(field => {
      const v = (formData[field] ?? '').toString()
      if (!v.trim()) {
        nextErrors[field] = 'Este campo es obligatorio'
        valid = false
      }
    })

    // Validar términos
    if (!formData.termsAccepted) {
      nextErrors.termsAccepted = 'Debes aceptar los términos y condiciones'
      valid = false
    }

    // Validaciones de formato/concordancia
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'El formato del correo electrónico no es válido'
      valid = false
    }

    if (formData.password && !validatePassword(formData.password)) {
      nextErrors.password = 'La contraseña no cumple con todos los requisitos'
      valid = false
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden'
      valid = false
    }

    setFieldErrors(nextErrors)
    if (!valid) {
      setError('Por favor, corrige los errores señalados')
    } else {
      setError('')
    }

    return valid
  }

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) e.stopImmediatePropagation()
    }

    if (isSubmitting.current) return false

    isSubmitting.current = true

    if (!validateForm()) {
      isSubmitting.current = false
      return false
    }

    let hasError = false
    const savedFormData = { ...formData }

    try {
      setLoading(true)
      setRedirecting(true)
      const { confirmPassword, termsAccepted, ...dataToRegister } = formData
      
      // Guardar email en localStorage ANTES de registrar
      localStorage.setItem('registrationEmail', formData.email)
      
      // ====== REGISTRO SIN INTERCEPTORES ======
      await safeRegister(dataToRegister)
      
      // ÉXITO: redirigir solo si no hay error
      if (!hasError && !hasActiveError.current) {
        navigate('/verify-registration-code', { 
          state: { email: formData.email },
          replace: true
        })
      }

      setLoading(false)
      setRedirecting(false)
      isSubmitting.current = false
      return true

    } catch (err) {
      hasError = true
      setLoading(false)
      setRedirecting(false)

      let errorMessage = 'Error al registrar usuario'
      let fieldErrs = {}

      const errorStatus = err.status || err.response?.status
      const detail = err.response?.data?.detail || err.message || ''
      
      // Detectar error de correo duplicado
      const txt = (typeof detail === 'string' ? detail : '').toLowerCase()
      const isEmailDuplicate = txt.includes('correo') && 
                               (txt.includes('registrado') || 
                                txt.includes('ya está') || 
                                txt.includes('ya existe'))

      if (errorStatus === 400 || isEmailDuplicate) {
        // Error de correo duplicado o validación
        if (isEmailDuplicate) {
          errorMessage = 'El correo electrónico ya está registrado'
          fieldErrs.email = errorMessage
        } else if (typeof detail === 'string') {
          errorMessage = detail
          // Intentar extraer el campo del error si es posible
          const lowerDetail = detail.toLowerCase()
          if (lowerDetail.includes('email') || lowerDetail.includes('correo')) {
            fieldErrs.email = errorMessage
          }
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Errores de validación de Pydantic
          const firstError = detail[0]
          errorMessage = firstError.msg || (typeof firstError === 'string' ? firstError : 'Error de validación en los datos ingresados')
          if (firstError.loc && Array.isArray(firstError.loc)) {
            const fieldName = firstError.loc[firstError.loc.length - 1]
            // Mapear nombres de backend a frontend
            const fieldMap = {
              'email': 'email',
              'first_name': 'firstName',
              'last_name': 'lastName',
              'password': 'password'
            }
            const frontendField = fieldMap[fieldName] || fieldName
            if (frontendField) fieldErrs[frontendField] = errorMessage
          }
        }
      } else if (errorStatus === 422) {
        if (Array.isArray(detail) && detail.length > 0) {
          const firstError = detail[0]
          errorMessage = firstError.msg || (typeof firstError === 'string' ? firstError : 'Error de validación en los datos ingresados')
          if (firstError.loc && Array.isArray(firstError.loc)) {
            const fieldName = firstError.loc[firstError.loc.length - 1]
            const fieldMap = {
              'email': 'email',
              'first_name': 'firstName',
              'last_name': 'lastName',
              'password': 'password'
            }
            const frontendField = fieldMap[fieldName] || fieldName
            if (frontendField) fieldErrs[frontendField] = errorMessage
          }
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = 'Error de validación en los datos ingresados'
        }
      } else if (errorStatus === 500) {
        errorMessage = 'Error interno del servidor. Por favor, intente más tarde'
        fieldErrs = {}
      } else if (typeof detail === 'string' && detail) {
        errorMessage = detail
        // Si el mensaje contiene información de correo duplicado, asignarlo al campo email
        const lowerErrorMsg = errorMessage.toLowerCase()
        if (lowerErrorMsg.includes('correo') && 
            (lowerErrorMsg.includes('registrado') || 
             lowerErrorMsg.includes('ya está') ||
             lowerErrorMsg.includes('ya existe'))) {
          fieldErrs.email = 'El correo electrónico ya está registrado'
        }
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Failed to fetch') || err.message?.includes('Network Error') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo'
        fieldErrs = {}
      }

      if (/network|conexión/i.test(errorMessage)) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo'
      }

      hasActiveError.current = true
      lastErrorRef.current = errorMessage
      lastFieldErrorsRef.current = fieldErrs

      if (!formData.email && !formData.password && savedFormData.email) {
        setFormData(savedFormData)
      }

      isSettingErrorsRef.current = true
      flushSync(() => {
        setFieldErrors(fieldErrs)
        setError(errorMessage)
        if (!formData.email && !formData.password && savedFormData.email) {
          setFormData(savedFormData)
        }
      })
      setTimeout(() => { isSettingErrorsRef.current = false }, 200)

      setTimeout(() => {
        if (hasActiveError.current) {
          setFieldErrors(prev => {
            if (Object.keys(prev).length === 0 && Object.keys(lastFieldErrorsRef.current).length > 0) {
              return { ...lastFieldErrorsRef.current }
            }
            return prev
          })

          setError(prev => (!prev && lastErrorRef.current ? lastErrorRef.current : prev))
        }
      }, 100)

      localStorage.removeItem('registrationEmail')
      
      // IMPORTANTÍSIMO: no navegamos ni recargamos aquí
      setTimeout(() => { isSubmitting.current = false }, 100)
      return false

    } finally {
      if (!hasError) isSubmitting.current = false
    }
  }

  return {
    // Estados
    formData,
    error,
    loading,
    showPassword,
    showConfirmPassword,
    fieldErrors,
    redirecting,
    passwordRequirements,
    
    // Handlers
    handleInputChange,
    handlePasswordToggle,
    handleSubmit,
    validateField,
    validatePassword
  }
}
