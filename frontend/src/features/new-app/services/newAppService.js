/**
 * Servicio de Gestión de Nuevas Aplicaciones - Frontend
 * Feature: Creación de Nueva Aplicación (RF-004)
 * 
 * Usa httpOnly cookies para autenticación
 */

const API_URL = 'http://localhost:3000/api';

export const newAppService = {
  
  /**
   * Obtiene las categorías de contenido disponibles
   * GET /api/new-app/categorias
   * 
   * @returns {Promise<Array>} - Lista de categorías activas
   */
  async obtenerCategorias() {
    try {
      const response = await fetch(`${API_URL}/new-app/categorias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al obtener categorías');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en obtenerCategorias:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva aplicación (juego) para un desarrollador
   * POST /api/new-app
   * 
   * @param {FormData} formData - Datos del formulario con archivos
   * @returns {Promise<Object>} - Datos de la aplicación creada
   */
  async crearAplicacion(formData) {
    try {
      const response = await fetch(`${API_URL}/new-app`, {
        method: 'POST',
        credentials: 'include', // Enviar cookies de autenticación
        body: formData, // No establecer Content-Type para FormData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear la aplicación');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en crearAplicacion:', error);
      throw error;
    }
  },

  /**
   * Lista todas las aplicaciones de un desarrollador
   * GET /api/new-app
   * 
   * @returns {Promise<Array>} - Lista de aplicaciones
   */
  async listarAplicaciones() {
    try {
      const response = await fetch(`${API_URL}/new-app`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al listar aplicaciones');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en listarAplicaciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de una aplicación específica
   * GET /api/new-app/:appId
   * 
   * @param {string} appId - ID de la aplicación
   * @returns {Promise<Object>} - Datos de la aplicación
   */
  async obtenerAplicacion(appId) {
    try {
      const response = await fetch(`${API_URL}/new-app/${appId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al obtener la aplicación');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en obtenerAplicacion:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de una aplicación
   * PUT /api/new-app/:appId
   * 
   * @param {string} appId - ID de la aplicación
   * @param {FormData} formData - Datos actualizados
   * @returns {Promise<Object>} - Datos actualizados
   */
  async actualizarAplicacion(appId, formData) {
    try {
      const response = await fetch(`${API_URL}/new-app/${appId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al actualizar la aplicación');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en actualizarAplicacion:', error);
      throw error;
    }
  },
};
