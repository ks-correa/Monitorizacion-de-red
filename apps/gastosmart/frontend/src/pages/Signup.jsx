import React from 'react'
import { Link } from 'react-router-dom'
import { useSignup } from '../hooks/useSignup'
import '../styles/auth.css'

// Componente reutilizable para campos de formulario
const FormField = ({ 
  label, 
  type = 'text', 
  name, 
  placeholder, 
  value, 
  onChange, 
  required = false, 
  minLength,
  autoComplete,
  icon,
  showPassword,
  onTogglePassword,
  error
}) => {
  const isPasswordField = type === 'password'
  
  return (
    <div className="form__row">
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      <div className={`field ${isPasswordField ? 'field--password' : ''}`}>
        {icon && (
          <div className="field__icon">
            {icon}
          </div>
        )}
        <input
          type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={error ? 'error' : ''}
        />
        {isPasswordField && onTogglePassword && (
          <button 
            type="button" 
            className="password-toggle" 
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="eye-off-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  )
}

// Componente para el grid de campos (nombre y apellido)
const FormRow = ({ children }) => (
  <div className="form-row">
    {children}
  </div>
)

// Componente para términos y condiciones
const TermsCheckbox = ({ checked, onChange, error }) => (
  <div className="form__terms">
    <input
      type="checkbox"
      name="termsAccepted"
      id="termsAccepted"
      checked={checked}
      onChange={onChange}
      required
    />
    <label htmlFor="termsAccepted">
      Acepto los <Link to="#" className="link">términos y condiciones</Link>
    </label>
    {error && <div className="field-error">{error}</div>}
  </div>
)

// Componente para el botón de envío
const SubmitButton = ({ loading, redirecting, children, disabled }) => (
  <button 
    type="button"
    className="btn" 
    disabled={disabled || loading || redirecting}
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      // El submit se maneja a través del formulario
    }}
  >
    {loading || redirecting ? (
      <>
        <div className="loading-spinner"></div>
        {redirecting ? 'Enviando código...' : 'Registrando...'}
      </>
    ) : (
      children
    )}
  </button>
)

// Componente principal de Signup
const SignupComponent = () => {
  const {
    formData,
    error,
    loading,
    showPassword,
    showConfirmPassword,
    fieldErrors,
    redirecting,
    passwordRequirements,
    handleInputChange,
    handlePasswordToggle,
    handleSubmit,
    validateField,
    validatePassword
  } = useSignup()


  // Íconos SVG como componentes
  const UserIcon = () => (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
    </svg>
  )

  const EmailIcon = () => (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1l10 6 10-6V6a2 2 0 0 0-2-2Zm0 6.236-8 4.8-8-4.8V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z"/>
    </svg>
  )

  const LockIcon = () => (
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 0V6a2 2 0 0 1 4 0v2Z"/>
    </svg>
  )


  return (
    <div className="signup-container">
      <section className="signup">
        <div className="signup__grid">
          {/* Panel izquierdo - Branding */}
          <aside className="signup__left">
            <div className="brand">
              <div className="brand__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M21 7h-1V6a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-4-1a1 1 0 0 1 1 1v1H5a2 2 0 0 1-2-2v-.171A1.83 1.83 0 0 1 4.829 4Zm5 8h-3V9h3Zm-5.5-2.5a1 1 0 1 1-1-1 1 1 0 0 1 1 1Z"/>
                </svg>
              </div>
              <h1 className="brand__title">GastoSmart</h1>
              <p className="brand__subtitle">
                Controla tus finanzas de manera inteligente y toma decisiones financieras más acertadas
              </p>
            </div>

            <ul className="features" role="list">
              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M5 3a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V5a2 2 0 0 0-2-2H5Zm2 6h10v2H7V9Zm0 4h6v2H7v-2Z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Seguimiento Inteligente</h3>
                  <p className="feature__desc">Monitorea tus gastos automáticamente</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 1a9 9 0 0 0-9 9v3.28l-1.447 3.447A1 1 0 0 0 2.447 18H6a9 9 0 1 0 6-17ZM4 10a8 8 0 1 1 8 8 8.03 8.03 0 0 1-7.06-4H4.447L6 11.72V10Z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Ahorro Automático</h3>
                  <p className="feature__desc">Alcanza tus metas financieras</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 1a7 7 0 0 0-7 7c0 5.25 7 14 7 14s7-8.75 7-14a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 8 2.5 2.5 0 0 1 12 10.5Z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Seguridad Total</h3>
                  <p className="feature__desc">Tus datos están protegidos</p>
                </div>
              </li>
            </ul>
          </aside>

          {/* Panel derecho - Formulario */}
          <section className="signup__right">
            <div className="formwrap">
              <header className="formwrap__header">
                <h2 className="formwrap__title">Crear Cuenta</h2>
                <p className="formwrap__subtitle">
                  Únete a GastoSmart y comienza a gestionar tus finanzas
                </p>
              </header>

              {/* Error general - solo se muestra si no hay errores de campo específicos */}
              {error && !fieldErrors.email && (
                <div className="field-error" id="signup-error">{error}</div>
              )}

              <form 
                className="form" 
                onSubmit={handleSubmit}
                noValidate
              >
                <FormRow>
                  <FormField
                    label="Nombre"
                    name="firstName"
                    placeholder="Ingresa tu nombre"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    minLength="2"
                    autoComplete="given-name"
                    icon={<UserIcon />}
                    error={fieldErrors.firstName}
                  />

                  <FormField
                    label="Apellido"
                    name="lastName"
                    placeholder="Ingresa tu apellido"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    minLength="2"
                    autoComplete="family-name"
                    icon={<UserIcon />}
                    error={fieldErrors.lastName}
                  />
                </FormRow>

                <FormField
                  label="Correo Electrónico"
                  type="email"
                  name="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  icon={<EmailIcon />}
                  error={fieldErrors.email}
                />

                <FormField
                  label="Contraseña"
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="8"
                  autoComplete="new-password"
                  icon={<LockIcon />}
                  showPassword={showPassword}
                  onTogglePassword={() => handlePasswordToggle('password')}
                  error={fieldErrors.password}
                />

                {/* Requisitos de contraseña */}
                {formData.password && (
                  <div 
                    className={`password-requirements ${Object.values(passwordRequirements).every(req => req === true) ? 'all-valid' : ''}`}
                    style={{
                      marginTop: '-0.5rem',
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: Object.values(passwordRequirements).every(req => req === true) ? '#d1fae5' : '#fef3c7',
                      borderRadius: '8px',
                      border: `2px solid ${Object.values(passwordRequirements).every(req => req === true) ? '#059669' : '#f59e0b'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      La contraseña debe contener:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      <li style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: passwordRequirements.length ? '#059669' : '#6b7280',
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontWeight: '700' }}>
                          {passwordRequirements.length ? '✓' : '✗'}
                        </span>
                        Mínimo 8 caracteres
                      </li>
                      <li style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: passwordRequirements.uppercase ? '#059669' : '#6b7280',
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontWeight: '700' }}>
                          {passwordRequirements.uppercase ? '✓' : '✗'}
                        </span>
                        Una letra mayúscula
                      </li>
                      <li style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: passwordRequirements.lowercase ? '#059669' : '#6b7280',
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontWeight: '700' }}>
                          {passwordRequirements.lowercase ? '✓' : '✗'}
                        </span>
                        Una letra minúscula
                      </li>
                      <li style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: passwordRequirements.number ? '#059669' : '#6b7280',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ fontWeight: '700' }}>
                          {passwordRequirements.number ? '✓' : '✗'}
                        </span>
                        Un número o símbolo
                      </li>
                    </ul>
                  </div>
                )}

                <FormField
                  label="Confirmar Contraseña"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength="8"
                  autoComplete="new-password"
                  icon={<LockIcon />}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => handlePasswordToggle('confirmPassword')}
                  error={fieldErrors.confirmPassword}
                />

                <TermsCheckbox
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  error={fieldErrors.termsAccepted}
                />

                <button 
                  type="submit"
                  className="btn" 
                  disabled={loading || redirecting}
                >
                  {loading || redirecting ? (
                    <>
                      <div className="loading-spinner"></div>
                      {redirecting ? 'Enviando código...' : 'Registrando...'}
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </form>

              <footer className="formwrap__footer">
                <p className="footer__text">
                  ¿Ya tienes una cuenta? <Link to="/login" className="footer__link">Iniciar Sesión</Link>
                </p>
              </footer>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default SignupComponent