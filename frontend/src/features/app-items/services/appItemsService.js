/**
 * Servicio de Items por Aplicacion - Frontend
 * Usa httpOnly cookies para autenticacion
 */

const API_URL = '/api/app-items';

export const appItemsService = {
  async listarItems(appId) {
    const response = await fetch(`${API_URL}/app/${appId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al listar items');
    }

    return data.data;
  },

  async crearItem(appId, payload) {
    const response = await fetch(`${API_URL}/app/${appId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al crear item');
    }

    return data.data;
  },

  async actualizarItem(itemId, payload) {
    const response = await fetch(`${API_URL}/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al actualizar item');
    }

    return data.data;
  },

  async eliminarItem(itemId, codigoMFA) {
    const response = await fetch(`${API_URL}/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ codigoMFA }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al eliminar item');
    }

    return data.data;
  },
};
