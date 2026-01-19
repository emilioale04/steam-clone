/**
 * Servicio de Mis Aplicaciones - Frontend
 * Feature: Mis Aplicaciones (Steamworks Dashboard)
 * 
 * Consume la API de my-apps del backend para obtener
 * las aplicaciones del desarrollador autenticado.
 */

const API_URL = '/api/my-apps';

export const myAppsService = {
  /**
   * Obtiene todas las aplicaciones del desarrollador
   * 
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.estado_revision - Filtrar por estado
   * @param {string} filters.search - Buscar por nombre
   * @returns {Promise<Object>} - { success, data, count, mensaje }
   */
  async obtenerAplicaciones(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.estado_revision) {
      params.append('estado_revision', filters.estado_revision);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;

    const response = await fetch(url, {
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al obtener aplicaciones');
    }
    return data;
  },

  /**
   * Obtiene solo las aplicaciones aprobadas del desarrollador
   * 
   * @returns {Promise<Object>} - { success, data, count, mensaje }
   */
  async obtenerAprobadas() {
    const response = await fetch(`${API_URL}/aprobadas`, {
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al obtener aplicaciones aprobadas');
    }
    return data;
  },

  /**
   * Obtiene una aplicación específica por su ID
   * 
   * @param {string} appId - UUID de la aplicación
   * @returns {Promise<Object>} - { success, data }
   */
  async obtenerAplicacion(appId) {
    const response = await fetch(`${API_URL}/${appId}`, {
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al obtener aplicación');
    }
    return data;
  },

  /**
   * Obtiene estadísticas de las aplicaciones del desarrollador
   * 
   * @returns {Promise<Object>} - { success, data: { total, borrador, en_revision, aprobado, rechazado, publicado } }
   */
  async obtenerEstadisticas() {
    const response = await fetch(`${API_URL}/stats`, {
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al obtener estadísticas');
    }
    return data;
  }
};
