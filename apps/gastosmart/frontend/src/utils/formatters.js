/**
 * Utilidades para formatear datos
 * Separación de funciones de formato de la lógica de componentes
 */

/**
 * Formatea un número con puntos de miles
 * @param {number} number - Número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
export const formatCurrency = (number) => {
  if (!number) return '0'
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

