/**
 * Pricing Service - Conecta con el backend de pricing
 * Implementa RF-010 (Definición de Precios)
 */

// Usa el proxy de Vite - las peticiones a /api se redirigen a localhost:3000
const API_URL = '/api';

/**
 * Obtiene las aplicaciones del desarrollador autenticado
 * GET /api/pricing/my-apps
 */
export async function fetchMyApps() {
  const response = await fetch(`${API_URL}/pricing/my-apps`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.mensaje || data.error || 'Error al obtener aplicaciones');
  }

  return data.apps || [];
}

/**
 * Obtiene detalles de una aplicación específica
 * GET /api/pricing/app/:appId
 */
export async function fetchAppDetails(appId) {
  const response = await fetch(`${API_URL}/pricing/app/${appId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.mensaje || data.error || 'Error al obtener detalles de la aplicación');
  }

  return data.app;
}

/**
 * Actualiza el precio de una aplicación
 * PUT /api/pricing/update-price
 * 
 * @param {string} appId - ID de la aplicación
 * @param {number} newPrice - Nuevo precio (0-1000 USD)
 * @param {string} codigoMFA - Código MFA para verificación
 */
export async function updateAppPrice(appId, newPrice, codigoMFA) {
  const response = await fetch(`${API_URL}/pricing/update-price`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ appId, newPrice: Number(newPrice), codigoMFA })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.mensaje || data.error || 'Error al actualizar precio');
  }

  return data;
}

/**
 * Actualiza el descuento de una aplicación
 * PUT /api/pricing/update-discount
 * 
 * @param {string} appId - ID de la aplicación
 * @param {number} newDiscount - Nuevo descuento (0-1, ej: 0.25 = 25%)
 * @param {string} codigoMFA - Código MFA para verificación
 */
export async function updateAppDiscount(appId, newDiscount, codigoMFA) {
  const response = await fetch(`${API_URL}/pricing/update-discount`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ appId, newDiscount: Number(newDiscount), codigoMFA })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.mensaje || data.error || 'Error al actualizar descuento');
  }

  return data;
}

