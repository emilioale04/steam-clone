export const MOCK_APPS = [
  {
    id: '1',
    nombre_juego: 'Juego Demo 1',
    precio_base_usd: 19.99,
    estado_revision: 'aprobado',
    updated_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    discount: 0.25 
  },
  {
    id: '2',
    nombre_juego: 'Juego Demo 2',
    precio_base_usd: 9.99,
    estado_revision: 'publicado',
    updated_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    discount: 0.5 
  }
];

export async function fetchMyApps(token) {
  // Siempre retorna el mock como si fuera el backend
  return Promise.resolve(MOCK_APPS);
}

export async function updateAppPrice(token, appId, price, mfaCode) {
  // Simula actualización exitosa
  return Promise.resolve({ appId, newPrice: price, success: true });
}

export async function updateAppDiscount(token, appId, discount, mfaCode) {
    // Simula actualización exitosa
    return Promise.resolve({ appId, newDiscount: discount, success: true });
}
