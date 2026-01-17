import { inventoryService } from '../services/inventoryService.js';

export const inventoryController = {
    /**
     * Obtener inventario de un usuario
     */
    async getInventory(req, res) {
        try {
            const { userId } = req.params;
            const viewerId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req

            const inventory = await inventoryService.getUserInventory(viewerId, userId);

            res.json({
                success: true,
                data: inventory
            });
        } catch (error) {
            res.status(error.message.includes('permiso') ? 403 : 500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Sincronizar con Steam
     */
    async syncInventory(req, res) {
        try {
            const userId = req.user.id;
            const { steamItems } = req.body;

            if (!steamItems || !Array.isArray(steamItems)) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una lista de items de Steam'
                });
            }

            const result = await inventoryService.syncWithSteam(userId, steamItems);

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Vender un item (poner en mercado)
     */
    async sellItem(req, res) {
        try {
            const userId = req.user.id;
            const { itemId, price } = req.body;

            if (!itemId || !price) {
                return res.status(400).json({ success: false, message: 'Faltan datos' });
            }

            const item = await inventoryService.listForSale(userId, itemId, price);

            res.json({
                success: true,
                message: 'Item puesto a la venta correctamente',
                listing: {
                    id: item.id,
                    name: item.name || `Item`,
                    price: item.listing_price,
                    seller: req.user.username || 'Tú', // req.user debe tener username si el middleware lo inyecta
                    listing_date: item.listing_date
                }
            });
        } catch (error) {
            console.error("Error en sellItem:", error); // Log para debug en servidor
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Cancelar una venta
     */
    async cancelListing(req, res) {
        try {
            const userId = req.user.id;
            const { listingId } = req.body;

            if (!listingId) {
                return res.status(400).json({ success: false, message: 'ID de venta requerido' });
            }

            await inventoryService.cancelListing(userId, listingId);

            res.json({
                success: true,
                message: 'Venta cancelada y artículo recuperado'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Obtener listado del mercado
     */
    async getMarketListings(req, res) {
        try {
            const listings = await inventoryService.getMarketListings();
            res.json({ success: true, listings });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Obtener trades activos
     */
    async getActiveTrades(req, res) {
        try {
            const trades = await inventoryService.getActiveTrades();
            res.json({ success: true, trades });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
