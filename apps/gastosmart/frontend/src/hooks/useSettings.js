import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { apiService } from '../services/apiService'

/**
 * Hook personalizado para manejar la lógica de configuración de usuario
 * Separa toda la lógica de negocio del componente de presentación
 */
export const useSettings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const profile = await apiService.userSettings.getProfile()
      setUserProfile(profile)
      
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number || '',
        country: profile.country
      })
      
    } catch (err) {
      setError(err.message)
      console.error('Error cargando perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Preparar solo los campos que cambiaron
      const updateData = {}
      
      if (data.first_name !== userProfile.first_name) {
        updateData.first_name = data.first_name
      }
      if (data.last_name !== userProfile.last_name) {
        updateData.last_name = data.last_name
      }
      if (data.email !== userProfile.email) {
        updateData.email = data.email
      }
      if (data.phone_number !== userProfile.phone_number) {
        updateData.phone_number = data.phone_number
      }
      
      if (Object.keys(updateData).length === 0) {
        setError('No hay cambios para guardar')
        return
      }
      
      // Enviar a la API
      await apiService.userSettings.updateProfile(updateData)
      
      // Recargar perfil actualizado
      await loadUserProfile()
      
      setSuccess('Cambios guardados exitosamente')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (err) {
      setError(err.message)
      console.error('Error actualizando perfil:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        setError(null)
        setSuccess(null)
        
        // Convertir imagen a base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            await apiService.userSettings.updateProfilePicture(reader.result)
            await loadUserProfile()
            setSuccess('Foto de perfil actualizada exitosamente')
            setTimeout(() => setSuccess(null), 3000)
          } catch (err) {
            setError('Error al actualizar foto de perfil')
            console.error('Error:', err)
          }
        }
        reader.readAsDataURL(file)
        
      } catch (err) {
        setError('Error al actualizar foto de perfil')
        console.error('Error:', err)
      }
    }
  }

  const formatPhoneNumber = (value) => {
    // Formatear número de teléfono colombiano: +57 XXX XXX XXXX
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('57')) {
      const number = cleaned.substring(2)
      if (number.length <= 10) {
        const formatted = number.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
        return `+57 ${formatted}`
      }
    }
    return value
  }

  const handlePhoneChange = (event) => {
    const formatted = formatPhoneNumber(event.target.value)
    setValue('phone_number', formatted)
  }

  return {
    // Estados
    loading,
    saving,
    error,
    success,
    userProfile,
    activeTab,
    
    // Form
    register,
    handleSubmit,
    errors,
    
    // Handlers
    onSubmit,
    handleProfilePictureChange,
    handlePhoneChange,
    setActiveTab,
    
    // Funciones de utilidad
    formatPhoneNumber
  }
}

