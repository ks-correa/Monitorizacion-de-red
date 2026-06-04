import React from 'react'
import { useNewPassword } from '../hooks/useNewPassword'
import '../styles/auth.css'

const NewPassword = () => {
  const {
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
    handlePasswordChange,
    handleSubmit,
    setNewPassword,
    setConfirmPassword,
    setShowNewPassword,
    setShowConfirmPassword
  } = useNewPassword()

  return (
    <div className="login-container">
      <section className="login">
        <div className="login__grid">
          <aside className="login__left">
            <div className="brand">
              <div className="brand__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <h1 className="brand__title">Nueva Contraseña</h1>
              <p className="brand__subtitle">
                Código verificado exitosamente. Ahora puedes establecer una nueva contraseña segura para tu cuenta.
              </p>
            </div>

            <ul className="features" role="list">
              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Seguridad</h3>
                  <p className="feature__desc">Tu contraseña será encriptada</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Requisitos</h3>
                  <p className="feature__desc">Asegura una contraseña fuerte</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 1a9 9 0 0 0-9 9v3.28l-1.447 3.447A1 1 0 0 0 2.447 18H6a9 9 0 1 0 6-17ZM4 10a8 8 0 1 1 8 8 8.03 8.03 0 0 1-7.06-4H4.447L6 11.72V10Z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Último Paso</h3>
                  <p className="feature__desc">Ya casi terminas</p>
                </div>
              </li>
            </ul>
          </aside>

          <section className="login__right">
            <div className="formwrap">
              <h2 className="formwrap__title">CREAR NUEVA CONTRASEÑA</h2>
              <p className="formwrap__subtitle">
                Establece una contraseña segura para: <strong>{email}</strong>
              </p>

              {error && <div className="error-message show">{error}</div>}
              {(success || redirecting) && (
                <div className="success-message">
                  {redirecting ? '✓ Contraseña actualizada. Redirigiendo al login...' : success}
                </div>
              )}

              <form className="form" onSubmit={handleSubmit}>
                <div className="form__row">
                  <label className="label">Nueva contraseña:</label>
                  <div className="field field--password">
                    <div className="field__icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        handlePasswordChange(e)
                      }}
                      required
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNewPassword ? (
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
                </div>

                {/* Requisitos de contraseña */}
                {newPassword && (
                  <div className={`password-requirements ${allRequirementsMet ? 'all-valid' : ''}`}>
                    <div className="password-requirements-title">
                      La contraseña debe contener:
                    </div>
                    <ul className="password-requirements-list">
                      <li className={`password-requirement-item ${passwordRequirements.length ? 'valid' : 'invalid'}`}>
                        <span className="password-requirement-icon">
                          {passwordRequirements.length ? '✓' : '✗'}
                        </span>
                        Mínimo 8 caracteres
                      </li>
                      <li className={`password-requirement-item ${passwordRequirements.uppercase ? 'valid' : 'invalid'}`}>
                        <span className="password-requirement-icon">
                          {passwordRequirements.uppercase ? '✓' : '✗'}
                        </span>
                        Una letra mayúscula
                      </li>
                      <li className={`password-requirement-item ${passwordRequirements.lowercase ? 'valid' : 'invalid'}`}>
                        <span className="password-requirement-icon">
                          {passwordRequirements.lowercase ? '✓' : '✗'}
                        </span>
                        Una letra minúscula
                      </li>
                      <li className={`password-requirement-item ${passwordRequirements.number ? 'valid' : 'invalid'}`}>
                        <span className="password-requirement-icon">
                          {passwordRequirements.number ? '✓' : '✗'}
                        </span>
                        Un número o símbolo
                      </li>
                    </ul>
                  </div>
                )}

                <div className="form__row">
                  <label className="label">Confirmar nueva contraseña:</label>
                  <div className="field field--password">
                    <div className="field__icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError('')
                        setSuccess('')
                      }}
                      required
                      autoComplete="new-password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? (
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
                </div>

                <div className="form__row">
                  <button 
                    type="submit" 
                    className={`btn btn-full-width ${(loading || redirecting || !allRequirementsMet) ? 'btn-disabled' : ''}`}
                    disabled={loading || redirecting || !allRequirementsMet}
                  >
                    {redirecting ? (
                      <>
                        <div className="loading-spinner"></div>
                        Redirigiendo...
                      </>
                    ) : loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Actualizando contraseña...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default NewPassword

