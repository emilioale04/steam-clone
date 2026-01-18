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
     * Actualiza el precio de una venta activa
     * @param {string} listingId - ID de la publicación
     * @param {number} newPrice - Nuevo precio (debe estar validado)
     */
    async updateListingPrice(listingId, newPrice) {
        const response = await fetch(`${API_URL}/inventory/sell/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ listingId, newPrice })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error al actualizar precio');
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
     * Obtiene el estado del límite diario de compras
     * @returns {Promise<{dailyTotal: number, dailyLimit: number, remaining: number, limitReached: boolean}>}
     */
    async getDailyPurchaseStatus() {
        const response = await fetch(`${API_URL}/inventory/market/daily-limit`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success) {
            return { dailyTotal: 0, dailyLimit: 2000, remaining: 2000, limitReached: false };
        }
        return data.data;
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
    },

    /**
     * Compra un item del marketplace
     * NOTA: El precio NO se envía desde el cliente por seguridad
     * El backend obtiene el precio real de la base de datos
     * @param {string} listingId - ID del listing a comprar
     * @returns {Promise<Object>} Resultado de la compra
     */
    async purchaseItem(listingId) {
        const response = await fetch(`${API_URL}/inventory/market/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ listingId })
        });

        const data = await response.json();
        
        if (!data.success) {
            const error = new Error(data.message || 'Error al realizar la compra');
            error.statusCode = response.status;
            throw error;
        }

        return {
            success: true,
            message: data.message,
            itemName: data.data?.itemName,
            pricePaid: data.data?.pricePaid,
            newBalance: data.data?.newBalance,
            transactionId: data.data?.transactionId
        };
    }
};