import React from 'react'
import { useVerifyRecoveryCode } from '../hooks/useVerifyRecoveryCode'
import '../styles/auth.css'

const VerifyRecoveryCode = () => {
  const {
    code,
    email,
    error,
    loading,
    timeLeft,
    canResend,
    resendTimer,
    redirecting,
    handleCodeChange,
    handleResendCode,
    handleSubmit,
    formatTime
  } = useVerifyRecoveryCode()

  return (
    <div className="signup-container">
      <section className="signup">
        <div className="signup__grid">
          <aside className="signup__left">
            <div className="brand">
              <div className="brand__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <h1 className="brand__title">Verifica tu Código</h1>
              <p className="brand__subtitle">
                Ingresa el código de 6 dígitos que enviamos a tu correo para continuar con la recuperación de contraseña
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
                  <h3 className="feature__title">Código Seguro</h3>
                  <p className="feature__desc">El código es válido por 10 minutos</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Verifica tu Email</h3>
                  <p className="feature__desc">Revisa tu bandeja de entrada y spam</p>
                </div>
              </li>

              <li className="feature">
                <div className="feature__icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="feature__content">
                  <h3 className="feature__title">Proceso Rápido</h3>
                  <p className="feature__desc">Solo toma unos segundos verificar</p>
                </div>
              </li>
            </ul>
          </aside>

          <section className="signup__right">
            <div className="formwrap">
              <h2 className="formwrap__title">VERIFICAR CÓDIGO</h2>
              <p className="formwrap__subtitle">
                Ingresa el código de 6 dígitos que recibiste en: <strong>{email}</strong>
              </p>

              {timeLeft > 0 && (
                <div className="timer-display">
                  El código expira en: {' '}
                  <strong className={timeLeft < 60 ? 'warning' : 'normal'}>
                    {formatTime(timeLeft)}
                  </strong>
                </div>
              )}

              {error && <div className="error-message show">{error}</div>}

              {redirecting && (
                <div className="success-message">
                  ✓ Código verificado. Redirigiendo...
                </div>
              )}

              <form className="form" onSubmit={handleSubmit}>
                <div className="form__row">
                  <label className="label">
                    Código de verificación:
                    <div className="field">
                      <div className="field__icon">
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
                        className="code-input"
                      />
                    </div>
                  </label>
                </div>

                <div className="form__row">
                  <button 
                    type="submit" 
                    className="btn btn-full-width" 
                    disabled={loading || redirecting || !email || code.length !== 6 || timeLeft === 0}
                  >
                    {redirecting ? (
                      <>
                        <div className="loading-spinner"></div>
                        Redirigiendo...
                      </>
                    ) : loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Verificando...
                      </>
                    ) : timeLeft === 0 ? (
                      'Código Expirado'
                    ) : (
                      'Verificar Código'
                    )}
                  </button>
                </div>
              </form>

              <div className="formwrap__footer">
                <p className="footer__text">
                  ¿No recibiste el código? {' '}
                  {canResend ? (
                    <button 
                      onClick={handleResendCode} 
                      disabled={loading}
                      className="resend-button"
                    >
                      Reenviar código
                    </button>
                  ) : (
                    <span className="resend-wait">
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

export default VerifyRecoveryCode
