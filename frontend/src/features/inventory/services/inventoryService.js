const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const inventoryService = {
    /**
     * Obtiene el inventario (items) de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<Array>} - Lista de items del inventario
     */
    async getInventory(userId) {
        const response = await fetch(`${API_URL}/inventory/${userId}`, {
            credentials: 'include' // httpOnly cookie sent automatically
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Obtiene un item específico por ID
     * @param {string} itemId - ID del item
     * @returns {Promise<Object>} - Item
     */
    async getItem(itemId) {
        const response = await fetch(`${API_URL}/inventory/item/${itemId}`, {
            credentials: 'include' // httpOnly cookie sent automatically
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Sincroniza el inventario con Steam
     * @param {Array} steamItems - Items de Steam { steam_item_id, is_tradeable, is_marketable, is_locked }
     */
    async syncInventory(steamItems) {
        const response = await fetch(`${API_URL}/inventory/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // httpOnly cookie sent automatically
            body: JSON.stringify({ steamItems })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    }
};