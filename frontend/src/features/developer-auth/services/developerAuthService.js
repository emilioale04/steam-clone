/**
 * Servicio de Autenticación para Desarrolladores (Steamworks) - Frontend
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
   * Iniciar sesión de desarrollador (RF-002)
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
      throw new Error(data.mensaje || 'Error en el inicio de sesión');
    return data;
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'Error al cerrar sesión');
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
   * Verificar si es desarrollador válido
   */
  async verificar() {
    const response = await fetch(`${API_URL}/verificar`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensaje || 'No autenticado');
    return data;
  },

  /**
   * Solicitar restablecimiento de contraseña
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
   * Restablecer contraseña con tokens
   */
  async resetPassword(password, accessToken, refreshToken) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, accessToken, refreshToken }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.mensaje || 'Error al restablecer contraseña');
    return data;
  },

  /**
   * Reenviar correo de verificación
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
        data.mensaje || 'Error al reenviar correo de verificación',
      );
    return data;
  },
};
