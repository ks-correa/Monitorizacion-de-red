import React from 'react'
import { useInitialBudget } from '../hooks/useInitialBudget'
import '../styles/initial-budget.css'

const InitialBudget = () => {
  const {
    incomeAmount,
    payFrequency,
    selectedGoal,
    goalAmount,
    goalTimeframe,
    customTimeframe,
    otherGoalName,
    otherGoalAmount,
    otherGoalTimeframe,
    otherCustomTimeframe,
    goalName,
    goalCategory,
    targetDate,
    description,
    error,
    loading,
    showOtherGoalForm,
    formatNumberWithThousands,
    parseFormattedNumber,
    getGoalDisplayName,
    getTargetDate,
    getDescription,
    handleCurrencyInput,
    handleIncomeChange,
    handleGoalChange,
    handleSubmit,
    setIncomeAmount,
    setPayFrequency,
    setGoalAmount,
    setGoalTimeframe,
    setCustomTimeframe,
    setOtherGoalName,
    setOtherGoalAmount,
    setOtherGoalTimeframe,
    setOtherCustomTimeframe,
    setGoalName,
    setGoalCategory,
    setTargetDate,
    setDescription
  } = useInitialBudget()

  return (
    <div className="container">
      <div className="budget-setup-container">
        {/* Columna izquierda: Formulario */}
        <section className="budget-setup__form">
          <div className="form-container">
            {/* Header */}
            <div className="form-header">
              <h2>Configuremos tu Presupuesto</h2>
              <p className="form-subtitle">
                Para comenzar, necesitamos conocer tus ingresos y metas financieras
              </p>
            </div>

            {error && (
              <div className="error-message">
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="budget-form">
              {/* Sección de Ingresos */}
              <section className="form-section">
                <h3>
                  <span>💰</span>
                  Ingresos
                </h3>
                
                <div className="input-group">
                  <label>Ingresa tu salario mensual *</label>
                  <div className="currency-input-group">
                    <div className="currency-prefix">
                      <span className="currency-symbol">COP $</span>
                    </div>
                    <input
                      type="text"
                      className="currency-input"
                      placeholder="1,500,000"
                      value={incomeAmount}
                      onChange={handleIncomeChange}
                      required
                    />
                  </div>
                  <small className="input-help">
                    Monto mínimo: $100,000 COP
                  </small>
                </div>

                <div className="input-group">
                  <label>Frecuencia de pago *</label>
                    <select
                    value={payFrequency}
                    onChange={(e) => setPayFrequency(e.target.value)}
                      required
                    >
                      <option value="mensual">Mensual</option>
                      <option value="quincenal">Quincenal</option>
                    </select>
                  </div>
              </section>

              {/* Sección de Meta Financiera */}
              <section className="form-section">
                <h3>
                  <span>🎯</span>
                  Meta Financiera Principal
                </h3>
                
                <p className="section-subtitle">
                  Define tu meta principal de ahorro
                </p>

                <div className="input-group">
                  <label>Nombre de la Meta *</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Ej: Viaje a Europa, Matrícula universitaria"
                    value={selectedGoal === 'other' ? otherGoalName : goalName}
                    onChange={(e) => {
                      if (selectedGoal === 'other') {
                        setOtherGoalName(e.target.value)
                        setGoalName(e.target.value)
                      } else {
                        setGoalName(e.target.value)
                      }
                    }}
                    maxLength="100"
                    required
                  />
                  <small className="input-help">
                    {selectedGoal === 'other' ? `${otherGoalName.length}/100 caracteres` : 'Nombre de tu meta principal'}
                  </small>
                </div>

                <div className="input-group">
                  <label>Categoría *</label>
                  <select
                    value={selectedGoal}
                    onChange={(e) => handleGoalChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="emergencia">Fondo de Emergencia</option>
                    <option value="viaje">Viajes</option>
                    <option value="casa">Vivienda</option>
                    <option value="educacion">Educación</option>
                    <option value="vehiculo">Vehículo</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="salud">Salud</option>
                    <option value="boda">Boda</option>
                    <option value="jubilacion">Jubilación</option>
                    <option value="ahorros">Ahorros</option>
                    <option value="inversiones">Inversiones</option>
                    <option value="other">Otros</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Monto Objetivo *</label>
                  <div className="currency-input-group">
                    <div className="currency-prefix">
                      <span className="currency-symbol">COP $</span>
                    </div>
                    <input
                      type="text"
                      className="currency-input"
                      placeholder="5,000,000"
                      value={selectedGoal === 'other' ? otherGoalAmount : goalAmount}
                      onChange={(e) => {
                        const formatted = handleCurrencyInput(e.target.value)
                        if (selectedGoal === 'other') {
                          setOtherGoalAmount(formatted)
                        } else {
                          setGoalAmount(formatted)
                        }
                      }}
                      required
                    />
                  </div>
                  <small className="input-help">
                    ¿Cuánto quieres ahorrar para esta meta?
                  </small>
                </div>

                <div className="input-group">
                  <label>Fecha Objetivo</label>
                  <input
                    type="date"
                    className="text-input"
                    value={getTargetDate()}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  <small className="input-help">
                    ¿Cuándo quieres alcanzar esta meta? (opcional)
                  </small>
                </div>

                <div className="input-group">
                  <label>Descripción</label>
                  <textarea
                    className="text-input"
                    placeholder="Describe tu meta (opcional)"
                    value={getDescription()}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    maxLength="500"
                  />
                  <small className="input-help">
                    {getDescription().length}/500 caracteres
                  </small>
                </div>
              </section>

              {/* Botón de envío */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn--primary btn--full ${loading ? 'disabled' : ''}`}
                >
                  {loading && <span className="btn-spinner"></span>}
                  {loading ? 'Configurando...' : 'Enviar'}
                </button>
              </div>
            </form>
            </div>
          </section>

        {/* Columna derecha: Panel verde con gradiente */}
        <aside className="budget-setup__green-panel"></aside>
        </div>
    </div>
  )
}

export default InitialBudget
