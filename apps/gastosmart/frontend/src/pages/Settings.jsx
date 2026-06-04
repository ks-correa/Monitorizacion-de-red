import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useSettings } from '../hooks/useSettings'
import '../styles/Settings.css'

const Settings = () => {
  const {
    loading,
    saving,
    error,
    success,
    userProfile,
    activeTab,
    register,
    handleSubmit,
    errors,
    onSubmit,
    handleProfilePictureChange,
    handlePhoneChange,
    setActiveTab
  } = useSettings()

  if (loading) {
    return (
      <DashboardLayout hideBudget={true}>
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Cargando ajustes...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout hideBudget={true}>
      <div className="settings-container">
        {/* Header */}
        <div className="page-header">
          <h1>Ajustes</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="icon-warning"></i>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <i className="icon-check"></i>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Información Personal
          </button>
        </div>

        {/* Personal Information Section */}
        {activeTab === 'personal' && (
          <div className="personal-info-section">
            {/* Profile Picture */}
            <div className="profile-picture-container">
              <div className="profile-picture">
                <img 
                  src={userProfile?.profile_picture || '/default-avatar.png'} 
                  alt="Foto de perfil"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEMyMCA2NS42NDA2IDMxLjY0MDYgNTQgNDYgNTRINTRDNjguMzU5NCA1NCA4MCA2NS42NDA2IDgwIDgwVjEwMEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                  }}
                />
                <div className="edit-icon">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="file-input"
                    id="profile-picture-input"
                  />
                  <label htmlFor="profile-picture-input" className="edit-button">
                    <i className="icon-edit"></i>
                  </label>
                </div>
              </div>
            </div>

            {/* Personal Information Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="personal-info-form">
              <div className="form-row">
                {/* Left Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="first_name">Nombre</label>
                    <input
                      type="text"
                      id="first_name"
                      {...register('first_name', {
                        required: 'El nombre es requerido',
                        minLength: {
                          value: 2,
                          message: 'El nombre debe tener al menos 2 caracteres'
                        },
                        pattern: {
                          value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                          message: 'El nombre solo puede contener letras y espacios'
                        }
                      })}
                      className={errors.first_name ? 'error' : ''}
                    />
                    {errors.first_name && (
                      <span className="error-message">{errors.first_name.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Correo</label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Formato de correo inválido'
                        }
                      })}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && (
                      <span className="error-message">{errors.email.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">País</label>
                    <select
                      id="country"
                      {...register('country')}
                      disabled
                      className="disabled"
                    >
                      <option value="Colombia">Colombia</option>
                    </select>
                    <span className="field-note">País fijo para la aplicación</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="last_name">Apellido</label>
                    <input
                      type="text"
                      id="last_name"
                      {...register('last_name', {
                        required: 'El apellido es requerido',
                        minLength: {
                          value: 2,
                          message: 'El apellido debe tener al menos 2 caracteres'
                        },
                        pattern: {
                          value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                          message: 'El apellido solo puede contener letras y espacios'
                        }
                      })}
                      className={errors.last_name ? 'error' : ''}
                    />
                    {errors.last_name && (
                      <span className="error-message">{errors.last_name.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone_number">Número de Teléfono</label>
                    <input
                      type="tel"
                      id="phone_number"
                      {...register('phone_number', {
                        required: 'El número de teléfono es requerido',
                        pattern: {
                          value: /^\+57\s\d{3}\s\d{3}\s\d{4}$/,
                          message: 'Formato: +57 XXX XXX XXXX'
                        }
                      })}
                      onChange={handlePhoneChange}
                      placeholder="+57 XXX XXX XXXX"
                      className={errors.phone_number ? 'error' : ''}
                    />
                    {errors.phone_number && (
                      <span className="error-message">{errors.phone_number.message}</span>
                    )}
                    <span className="field-note">Formato: +57 XXX XXX XXXX</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-save-changes"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Settings