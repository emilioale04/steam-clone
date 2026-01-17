/**
 * Servicio de Gestión de Llaves de Juego - Frontend
 * Grupo 2 - Feature: Gestión de Llaves
 * 
 * Usa httpOnly cookies para autenticación (más seguro que localStorage)
 */

const API_URL = '/api';

export const gameKeysService = {
  
  /**
   * Genera nuevas llaves para un juego
   * POST /api/game-keys/:juegoId
   */
  async generarLlaves(juegoId, cantidad = 1) {
    try {
      const response = await fetch(`${API_URL}/game-keys/${juegoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cantidad }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al generar llaves');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en generarLlaves:', error);
      throw error;
    }
  },
  
  /**
   * Lista todas las llaves de un juego
   * GET /api/game-keys/:juegoId
   */
  async listarLlaves(juegoId) {
    try {
      const response = await fetch(`${API_URL}/game-keys/${juegoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al listar llaves');
      }
      
      console.log('[FRONTEND DEBUG] Respuesta del backend:', data);
      console.log('[FRONTEND DEBUG] Llaves recibidas:', data.data?.llaves);
      return data.data;
    } catch (error) {
      console.error('Error en listarLlaves:', error);
      throw error;
    }
  },
  
  /**
   * Desactiva una llave con motivo
   * DELETE /api/game-keys/:llaveId
   */
  async desactivarLlave(llaveId, motivo) {
    try {
      const response = await fetch(`${API_URL}/game-keys/${llaveId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ motivo }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al desactivar llave');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error en desactivarLlave:', error);
      throw error;
    }
  },
};
