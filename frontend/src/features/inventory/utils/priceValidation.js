/**
 * Utilidades de validación de precios para el marketplace e inventario
 */

// Constantes de validación de precios
export const PRICE_CONFIG = {
  MIN: 0.01,
  MAX: 2000,
  DECIMALS: 2,
};

// Constantes de límites de marketplace
export const MARKETPLACE_LIMITS = {
  MAX_ACTIVE_LISTINGS: 10,
  DAILY_PURCHASE_LIMIT: 2000, // Límite diario de compra en USD
};

// Constantes de límites de trading
export const TRADE_LIMITS = {
  MAX_ACTIVE_TRADES: 10,         // Máximo de trades activos por usuario
  MAX_OFFERS_PER_TRADE: 20,      // Máximo de ofertas por publicación de trade
  TRADE_EXPIRY_DAYS: 7,          // Días hasta que expira un trade
};

/**
 * Valida un precio y retorna el resultado
 * @param {string|number} price - El precio a validar
 * @returns {{ valid: boolean, message?: string, price?: number }}
 */
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);

  if (isNaN(numPrice)) {
    return { valid: false, message: 'El precio debe ser un número válido.' };
  }

  if (numPrice < PRICE_CONFIG.MIN) {
    return { valid: false, message: `El precio mínimo es $${PRICE_CONFIG.MIN.toFixed(2)}.` };
  }

  if (numPrice > PRICE_CONFIG.MAX) {
    return { valid: false, message: `El precio máximo es $${PRICE_CONFIG.MAX.toLocaleString()}.` };
  }

  // Verificar que no tenga más de 2 decimales
  const decimalPart = price.toString().split('.')[1];
  if (decimalPart && decimalPart.length > PRICE_CONFIG.DECIMALS) {
    return { valid: false, message: `El precio no puede tener más de ${PRICE_CONFIG.DECIMALS} decimales.` };
  }

  return { valid: true, price: numPrice };
};

/**
 * Sanitiza el valor del input de precio mientras el usuario escribe
 * @param {string} value - El valor del input
 * @returns {{ isValid: boolean, value: string }}
 */
export const sanitizePriceInput = (value) => {
  // Permitir vacío
  if (value === '') {
    return { isValid: true, value: '' };
  }

  // Verificar formato válido (números con hasta 2 decimales)
  if (!/^\d*\.?\d{0,2}$/.test(value)) {
    return { isValid: false, value };
  }

  // Verificar que no exceda el máximo
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && numValue > PRICE_CONFIG.MAX) {
    return { isValid: false, value };
  }

  return { isValid: true, value };
};

/**
 * Formatea el precio al perder foco del input
 * @param {string} value - El valor del input
 * @returns {string} - El valor formateado o vacío
 */
export const formatPriceOnBlur = (value) => {
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && numValue > 0) {
    return Math.min(numValue, PRICE_CONFIG.MAX).toFixed(PRICE_CONFIG.DECIMALS);
  }
  return '';
};

/**
 * Verifica si el precio está fuera de rango para mostrar errores visuales
 * @param {string} price - El precio a verificar
 * @returns {{ isTooLow: boolean, isTooHigh: boolean, isInvalid: boolean }}
 */
export const getPriceValidationState = (price) => {
  if (!price || price === '') {
    return { isTooLow: false, isTooHigh: false, isInvalid: false };
  }

  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    return { isTooLow: false, isTooHigh: false, isInvalid: true };
  }

  return {
    isTooLow: numPrice > 0 && numPrice < PRICE_CONFIG.MIN,
    isTooHigh: numPrice > PRICE_CONFIG.MAX,
    isInvalid: false,
  };
};
