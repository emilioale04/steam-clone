/**
 * Servicio de Autenticaci贸n para Desarrolladores (Steamworks) - Frontend
 * Consume la API de desarrolladores del backend
 */

const API_URL = '/api/desarrolladores/auth';

export const developerAuthService = {
  /**
   * Registrar nuevo desarrollador (RF-001)
   */
  async registrar(datosRegistro) {
    const response = await fetch(`${API_URL}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosRegistro),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'Error en el registro');
    return data;
  },

  /**
   * Iniciar sesi贸n de desarrollador (RF-002)
   */
  async login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error en el inicio de sesi');
    return data;
  },

  /**
   * Verificar MFA durante login
   */
  async verifyMFALogin(codigo) {
    const response = await fetch(`${API_URL}/verify-mfa-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ codigo }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.mensaje || 'Cigo MFA inv爈ido');
      throw err;
    }
    return data;
  },

  /**
   * Cerrar sesi贸n
   */
  async logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'Error al cerrar sesi贸n');
    return data;
  },

  /**
   * Obtener perfil del desarrollador autenticado
   */
  async obtenerPerfil() {
    const response = await fetch(`${API_URL}/perfil`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al obtener perfil');
    return data;
  },

  /**
   * Obtener aplicaciones del desarrollador
   */
  async obtenerAplicaciones() {
    const response = await fetch(`${API_URL}/aplicaciones`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al obtener aplicaciones');
    return data;
  },

  /**
   * Validar sesi actual
   */
  async validateSession() {
    const response = await fetch(`${API_URL}/validate-session`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.mensaje || 'Sesi inv爈ida');
      err.mfaRequired = data.mfaRequired;
      throw err;
    }
    return data;
  },

  /**
   * Verificar si es desarrollador v谩lido
   */
  async verificar() {
    const response = await fetch(`${API_URL}/verificar`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'No autenticado');
    return data;
  },

  /**
   * Solicitar restablecimiento de contrase帽a
   */
  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'Error al enviar email');
    return data;
  },

  /**
   * Restablecer contrase帽a con tokens
   */
  async resetPassword(password, accessToken, refreshToken) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, accessToken, refreshToken }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al restablecer contrase帽a');
    return data;
  },

  /**
   * Reenviar correo de verificaci贸n
   */
  async reenviarVerificacion(email) {
    const response = await fetch(`${API_URL}/reenviar-verificacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.mensaje || 'Error al reenviar correo de verificaci贸n',
      );
    return data;
  },
};
