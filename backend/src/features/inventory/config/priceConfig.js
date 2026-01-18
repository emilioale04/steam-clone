/**
 * Configuración centralizada de precios para el marketplace
 * Estas constantes deben mantenerse sincronizadas con el frontend
 * Frontend: frontend/src/features/inventory/utils/priceValidation.js
 */

export const PRICE_CONFIG = {
  MIN: 0.01,
  MAX: 2000,
  DECIMALS: 2,
};

export const MARKETPLACE_LIMITS = {
  MAX_ACTIVE_LISTINGS: 10,
  DAILY_PURCHASE_LIMIT: 2000, // Límite diario de compra en USD
};

export const TRADE_LIMITS = {
  MAX_ACTIVE_TRADES: 10,         // Máximo de trades activos por usuario
  MAX_OFFERS_PER_TRADE: 20,      // Máximo de ofertas por publicación de trade
  TRADE_EXPIRY_DAYS: 7,          // Días hasta que expira un trade
};

/**
 * Valida un precio y retorna resultado sanitizado
 * @param {string|number} price - El precio a validar
 * @returns {{ valid: boolean, error?: string, sanitizedPrice?: number }}
 */
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);

  if (isNaN(numPrice)) {
    return { valid: false, error: 'El precio debe ser un número válido' };
  }

  if (numPrice < PRICE_CONFIG.MIN) {
    return { valid: false, error: `El precio mínimo es $${PRICE_CONFIG.MIN.toFixed(2)}` };
  }

  if (numPrice > PRICE_CONFIG.MAX) {
    return { valid: false, error: `El precio máximo es $${PRICE_CONFIG.MAX.toLocaleString()}` };
  }

  // Verificar que no tenga más de 2 decimales
  const decimalPart = price.toString().split('.')[1];
  if (decimalPart && decimalPart.length > PRICE_CONFIG.DECIMALS) {
    return { valid: false, error: `El precio no puede tener más de ${PRICE_CONFIG.DECIMALS} decimales` };
  }

  // Redondear a 2 decimales para evitar problemas de precisión
  const sanitizedPrice = Math.round(numPrice * 100) / 100;

  return { valid: true, sanitizedPrice };
};

/**
 * Valida formato UUID (prevenir inyección)
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
