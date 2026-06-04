import React from 'react'
import { useVerifyRegistrationCode } from '../hooks/useVerifyRegistrationCode'
import '../styles/verify-registration-code.css'

const VerifyRegistrationCodeComponent = () => {
  const {
    code,
    error,
    loading,
    email,
    timeLeft,
    canResend,
    resendTimer,
    redirecting,
    handleCodeChange,
    handleResendCode,
    handleSubmit,
    formatTime
  } = useVerifyRegistrationCode()

  return (
    <div className="verify-code-container">
      <section className="verify-code">
        <div className="verify-code-grid">
          {/* Panel izquierdo */}
          <aside className="verify-code-left">
            <div className="verify-brand-section">
              <div className="verify-brand-logo">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                  <path d="M21 7h-1V6a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-4-1a1 1 0 0 1 1 1v1H5a2 2 0 0 1-2-2v-.171A1.83 1.83 0 0 1 4.829 4Zm5 8h-3V9h3Zm-5.5-2.5a1 1 0 1 1-1-1 1 1 0 0 1 1 1Z"/>
                </svg>
              </div>
              <h1 className="verify-brand-title">
                GastoSmart
              </h1>
              <p className="verify-brand-subtitle">
                Verifica tu cuenta para comenzar a gestionar tus finanzas de manera inteligente
              </p>
            </div>

            <ul className="verify-features-list">
              <li className="verify-feature-item">
                <div className="verify-feature-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <div className="verify-feature-content">
                  <h3 className="verify-feature-title">
                    Seguridad Verificada
                  </h3>
                  <p className="verify-feature-desc">
                    Tu código es único y expira en 10 minutos
                  </p>
                </div>
              </li>

              <li className="verify-feature-item">
                <div className="verify-feature-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="verify-feature-content">
                  <h3 className="verify-feature-title">
                    Código por Email
                  </h3>
                  <p className="verify-feature-desc">
                    Revisa tu bandeja de entrada y spam
                  </p>
                </div>
              </li>

              <li className="verify-feature-item">
                <div className="verify-feature-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="verify-feature-content">
                  <h3 className="verify-feature-title">
                    Activación Rápida
                  </h3>
                  <p className="verify-feature-desc">
                    Accede a todas las funciones en segundos
                  </p>
                </div>
              </li>
            </ul>
          </aside>

          {/* Panel derecho */}
          <section className="verify-code-right">
            <div className="verify-form-wrap">
              <h2 className="verify-form-wrap-title">VERIFICAR REGISTRO</h2>
              <p className="verify-form-wrap-subtitle">
                Ingresa el código de 6 dígitos que recibiste en: <strong>{email}</strong>
              </p>

              {timeLeft > 0 && (
                <div className="verify-timer-display">
                  El código expira en: <strong className={timeLeft < 60 ? 'warning' : 'normal'}>{formatTime(timeLeft)}</strong>
                </div>
              )}

              <form className="verify-form" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}>
                {error && (
                  <div className="verify-error-message">
                    {error}
                  </div>
                )}
                
                <div className="verify-form-row">
                  <label className="verify-label">
                    Código de verificación:
                    <div className="verify-field">
                      <div className="verify-field-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        required
                        maxLength="6"
                        disabled={timeLeft === 0}
                        autoFocus
                        className="verify-input code-input"
                      />
                    </div>
                  </label>
                </div>

                <div className="verify-form-row">
                  <button 
                    type="submit" 
                    className="verify-submit-button" 
                    disabled={loading || !email || code.length !== 6 || timeLeft === 0}
                  >
                    {loading ? 'Verificando...' : timeLeft === 0 ? 'Código Expirado' : 'Verificar Código'}
                  </button>
                </div>
              </form>

              <div className="verify-form-wrap-footer">
                <p className="verify-footer-text">
                  ¿No recibiste el código? {' '}
                  {canResend ? (
                    <button 
                      onClick={handleResendCode} 
                      disabled={loading}
                      className="verify-footer-link"
                    >
                      Reenviar código
                    </button>
                  ) : (
                    <span className="verify-resend-wait">
                      Espera {resendTimer}s para reenviar
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default VerifyRegistrationCodeComponent
