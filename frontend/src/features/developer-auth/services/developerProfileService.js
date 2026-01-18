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

  /**
   * Obtener estado de MFA
   */
  async obtenerEstadoMFA() {
    const response = await fetch(`${API_URL}/mfa/status`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al obtener estado de MFA');
    return data;
  },

  /**
   * Iniciar configuración de MFA (obtener QR)
   */
  async setupMFA() {
    const response = await fetch(`${API_URL}/mfa/setup`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al configurar MFA');
    return data;
  },

  /**
   * Verificar código TOTP y activar MFA
   */
  async verificarYActivarMFA(codigo) {
    const response = await fetch(`${API_URL}/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ codigo }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Código de verificación inválido');
    return data;
  },

  /**
   * Deshabilitar MFA
   */
  async deshabilitarMFA(codigo) {
    const response = await fetch(`${API_URL}/mfa/disable`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ codigo }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al deshabilitar MFA');
    return data;
  },
};
