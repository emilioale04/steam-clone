/**
 * Servicio de Gestión de Perfil de Desarrolladores - Frontend
 * Consume endpoints de perfil del backend
 */

const API_URL = '/api/desarrolladores/perfil';

export const developerProfileService = {
  /**
   * Obtener perfil completo del desarrollador
   */
  async obtenerPerfilCompleto() {
    const response = await fetch(`${API_URL}/completo`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al obtener perfil');
    return data;
  },

  /**
   * Actualizar información personal
   * Requiere código MFA
   */
  async actualizarInformacionPersonal(nombre_legal, telefono, codigoMFA) {
    const response = await fetch(`${API_URL}/informacion-personal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nombre_legal, telefono, codigoMFA }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.mensaje || 'Error al actualizar información personal',
      );
    return data;
  },

  /**
   * Actualizar información bancaria
   * Requiere código MFA
   */
  async actualizarInformacionBancaria(
    banco,
    numero_cuenta,
    titular_cuenta,
    codigoMFA,
  ) {
    const response = await fetch(`${API_URL}/informacion-bancaria`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ banco, numero_cuenta, titular_cuenta, codigoMFA }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.mensaje || 'Error al actualizar información bancaria',
      );
    return data;
  },
};
