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
    },

    /**
     * Vende un item en el mercado
     * @param {string} userId - ID del usuario
     * @param {object} item - Objeto del item a vender
     * @param {string|number} price - Precio de venta
     */
    async sellItem(userId, item, price) {
        const response = await fetch(`${API_URL}/inventory/sell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                itemId: item.id,
                price: parseFloat(price)
            })
        });

        const data = await response.json();
        /* Si falla, lanzamos error para que el frontend capture */
        if (!data.success) throw new Error(data.message || 'Error al vender item');
        
        return {
            success: true,
            listing: data.listing // El backend debe devolver el objeto listing creado
        };
    },

    /**
     * Cancela una venta activa
     * @param {string} listingId 
     */
    async cancelListing(listingId) {
        const response = await fetch(`${API_URL}/inventory/sell/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ listingId })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error al cancelar venta');
        return data;
    },

    /**
     * Obtiene el listado del mercado
     */
    async getMarketListings() {
        const response = await fetch(`${API_URL}/inventory/market`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success) return { success: false, listings: [] };
        return { success: true, listings: data.listings };
    },

    /**
     * Obtiene trades activos
     */
    async getActiveTrades() {
        const response = await fetch(`${API_URL}/inventory/trades`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success) return { success: false, trades: [] };
        return { success: true, trades: data.trades };
    }
};