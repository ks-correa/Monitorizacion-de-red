import React from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import '../styles/auth.css'

const LoginComponent = () => {
  const {
    formData,
    error,
    info,
    loading,
    showPassword,
    fieldErrors,
    failedAttempts,
    isBlocked,
    timeLeft,
    handleChange,
    handleSubmit,
    setShowPassword,
    formatTime
  } = useLogin()

  // Debug liviano (opcional)
  React.useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      console.log('[Login] fieldErrors:', fieldErrors)
    }
  }, [fieldErrors])

  return (
    <div className="login-container">
      <section className="login">
        <div className="login__grid">
          <aside className="login__left">
            <div className="brand">
              <div className="brand__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M21 7h-1V6a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-4-1a1 1 0 0 1 1 1v1H5a2 2 0 0 1-2-2v-.171A1.83 1.83 0 0 1 4.829 4Zm5 8h-3V9h3Zm-5.5-2.5a1 1 0 1 1-1-1 1 1 0 0 1 1 1Z"/>
                </svg>
              </div>
              <h1 className="brand__title">GastoSmart</h1>
              <p className="brand__subtitle">
                Bienvenido de vuelta. Accede a tu cuenta para continuar gestionando tus finanzas de manera inteligente
              </p>
            </div>

            <ul className="features" role="list">
              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Acceso Seguro</h3>
                  <p className="feature__desc">Tu información está protegida con encriptación avanzada</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 1a9 9 0 0 0-9 9v3.28l-1.447 3.447A1 1 0 0 0 2.447 18H6a9 9 0 1 0 6-17ZM4 10a8 8 0 1 1 8 8 8.03 8.03 0 0 1-7.06-4H4.447L6 11.72V10Z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Sesión Inteligente</h3>
                  <p className="feature__desc">Mantén tu sesión activa de forma segura</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Dashboard Personalizado</h3>
                  <p className="feature__desc">Accede a tus reportes y análisis financieros</p>
                </div>
              </li>
            </ul>
          </aside>

          <section className="login__right">
            <div className="formwrap">
              <h2 className="formwrap__title">INICIAR SESIÓN</h2>
              <p className="formwrap__subtitle">Ingresa tus credenciales para acceder a tu cuenta</p>

              {info && (<div className="info-message">{info}</div>)}

              <form
                className="form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="form__row">
                  <label className="label">
                    Ingrese su correo:
                    <div className="field">
                      <div className="field__icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="youremail@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        className={fieldErrors.email ? 'error' : ''}
                      />
                    </div>
                    {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
                  </label>
                </div>

                <div className="form__row">
                  <label className="label">Ingrese su contraseña:</label>
                  <div className="field field--password">
                    <div className="field__icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      className={fieldErrors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Mostrar contraseña"
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
                  </div>
                  {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                </div>

                <button
                  type="submit"
                  className="btn"
                  disabled={loading || isBlocked}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Iniciando sesión...
                    </>
                  ) : isBlocked ? (
                    `Bloqueado (${formatTime(timeLeft)})`
                  ) : (
                    'Entrar'
                  )}
                </button>

                {/* Intentos / advertencia */}
                {failedAttempts > 0 && !isBlocked && (
                  <div className="warning-message">
                    Intentos fallidos: {failedAttempts}/5{' '}
                    {failedAttempts >= 3 && (
                      <strong>⚠️ Después de 5 intentos fallidos, la cuenta se bloqueará por 15 minutos</strong>
                    )}
                  </div>
                )}

                {/* Error general */}
                {error && !fieldErrors.email && (
                  <div className="field-error" id="login-error">{error}</div>
                )}
              </form>

              <div className="formwrap__footer">
                <p className="footer__text">
                  <Link to="/password-reset" className="footer__link">¿Olvidé mi contraseña?</Link>
                </p>
                <p className="footer__text">
                  ¿No tienes cuenta? <Link to="/signup" className="footer__link">Crear cuenta</Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default LoginComponent
