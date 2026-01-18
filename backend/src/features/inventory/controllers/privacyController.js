import { privacyService } from '../services/privacyService.js';

export const privacyController = {
    /**
     * Obtiene la configuración de privacidad del usuario autenticado
     * GET /api/privacy/settings
     */
    async getPrivacySettings(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const settings = await privacyService.getPrivacySettings(userId);

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Error en getPrivacySettings:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener configuración de privacidad'
            });
        }
    },

    /**
     * Actualiza la configuración de privacidad del usuario autenticado
     * PUT /api/privacy/settings
     * Body: { inventory?: 'public'|'friends'|'private', trade?: '...', marketplace?: '...' }
     */
    async updatePrivacySettings(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { inventory, trade, marketplace } = req.body;

            // Validar que al menos un campo fue proporcionado
            if (inventory === undefined && trade === undefined && marketplace === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar al menos una configuración de privacidad (inventory, trade, marketplace)'
                });
            }

            const settings = await privacyService.updatePrivacySettings(userId, {
                inventory,
                trade,
                marketplace
            });

            res.json({
                success: true,
                message: 'Configuración de privacidad actualizada correctamente',
                data: settings
            });
        } catch (error) {
            console.error('Error en updatePrivacySettings:', error);
            
            // Si es error de validación, devolver 400
            if (error.message.includes('inválido') || error.message.includes('Valores permitidos')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar configuración de privacidad'
            });
        }
    },

    /**
     * Verifica si el usuario autenticado puede ver el inventario de otro usuario
     * GET /api/privacy/check/inventory/:userId
     */
    async checkInventoryAccess(req, res) {
        try {
            const viewerId = req.user?.id;
            const { userId: ownerId } = req.params;

            const result = await privacyService.checkAccess(ownerId, viewerId, 'inventory');

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error en checkInventoryAccess:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Verifica si el usuario autenticado puede enviar trade a otro usuario
     * GET /api/privacy/check/trade/:userId
     */
    async checkTradeAccess(req, res) {
        try {
            const senderId = req.user?.id;
            const { userId: receiverId } = req.params;

            if (!senderId) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes iniciar sesión para verificar acceso a intercambios'
                });
            }

            const result = await privacyService.canSendTrade(senderId, receiverId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error en checkTradeAccess:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Verifica si el usuario autenticado puede comprar de otro usuario
     * GET /api/privacy/check/marketplace/:userId
     */
    async checkMarketplaceAccess(req, res) {
        try {
            const buyerId = req.user?.id;
            const { userId: sellerId } = req.params;

            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes iniciar sesión para verificar acceso al marketplace'
                });
            }

            const result = await privacyService.canPurchaseFrom(buyerId, sellerId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error en checkMarketplaceAccess:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtiene la configuración de privacidad de otro usuario (vista pública)
     * Solo retorna información básica de cómo está configurado
     * GET /api/privacy/profile/:userId
     */
    async getProfilePrivacyInfo(req, res) {
        try {
            const viewerId = req.user?.id;
            const { userId: ownerId } = req.params;

            // Verificar accesos para cada tipo
            const [inventoryAccess, tradeAccess, marketplaceAccess] = await Promise.all([
                privacyService.checkAccess(ownerId, viewerId, 'inventory'),
                privacyService.checkAccess(ownerId, viewerId, 'trade'),
                privacyService.checkAccess(ownerId, viewerId, 'marketplace')
            ]);

            res.json({
                success: true,
                data: {
                    canViewInventory: inventoryAccess.allowed,
                    canTrade: tradeAccess.allowed,
                    canPurchase: marketplaceAccess.allowed,
                    inventoryReason: inventoryAccess.reason,
                    tradeReason: tradeAccess.reason,
                    marketplaceReason: marketplaceAccess.reason
                }
            });
        } catch (error) {
            console.error('Error en getProfilePrivacyInfo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default privacyController;
