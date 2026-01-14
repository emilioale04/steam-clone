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
    }
};
