import { inventoryService } from '../services/inventoryService.js';
import { privacyService } from '../services/privacyService.js';
import { validatePrice, isValidUUID, MARKETPLACE_LIMITS } from '../config/priceConfig.js';
import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

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

            if (!itemId || price === undefined || price === null) {
                return res.status(400).json({ success: false, message: 'Faltan datos requeridos (itemId y price)' });
            }

            // Validación de límite de listings activos
            const activeListingsCount = await inventoryService.countActiveListings(userId);
            
            if (activeListingsCount >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Has alcanzado el límite máximo de ${MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS} artículos en venta. Cancela alguna venta para publicar más.`,
                    code: 'MAX_LISTINGS_REACHED',
                    currentCount: activeListingsCount,
                    maxAllowed: MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS
                });
            }

            // Validación de precio usando utilidad centralizada
            const priceValidation = validatePrice(price);
            if (!priceValidation.valid) {
                return res.status(400).json({ success: false, message: priceValidation.error });
            }

            const item = await inventoryService.listForSale(userId, itemId, priceValidation.sanitizedPrice);

            res.json({
                success: true,
                message: 'Item puesto a la venta correctamente',
                listing: {
                    id: item.id,
                    name: item.name || 'Item',
                    price: item.listing_price,
                    seller: req.user.username || 'Tú', // req.user debe tener username si el middleware lo inyecta
                    listing_date: item.listing_date
                }
            });
        } catch (error) {
            console.error('Error en sellItem:', error); // Log para debug en servidor
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
     * Obtener estado del límite diario de compras
     */
    async getDailyPurchaseStatus(req, res) {
        try {
            const userId = req.user.id;
            const dailyTotal = await inventoryService.getDailyPurchaseTotal(userId);
            const remaining = Math.max(0, MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT - dailyTotal);

            res.json({
                success: true,
                data: {
                    dailyTotal: dailyTotal,
                    dailyLimit: MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT,
                    remaining: remaining,
                    limitReached: dailyTotal >= MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT
                }
            });
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
    },

    /**
     * Comprar un item del marketplace
     * IMPORTANTE: El precio NO se recibe del cliente, se obtiene de la DB
     * Valida límite diario de compra
     */
    async purchaseItem(req, res) {
        try {
            const buyerId = req.user.id;
            const { listingId } = req.body;

            // Validación básica
            if (!listingId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de publicación requerido' 
                });
            }

            // Validar formato UUID básico (prevenir inyección)
            if (!isValidUUID(listingId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Formato de ID inválido' 
                });
            }

            // Obtener el precio del item ANTES de verificar límite
            const { data: listing, error: listingError } = await supabase
                .from('marketplace_listings')
                .select('price, seller_id')
                .eq('id', listingId)
                .eq('status', 'Active')
                .single();

            if (listingError || !listing) {
                return res.status(404).json({
                    success: false,
                    message: 'Artículo no encontrado o ya no está disponible'
                });
            }

            // Verificar privacidad del marketplace: ¿El vendedor acepta compras de este usuario?
            const privacyCheck = await privacyService.canPurchaseFrom(buyerId, listing.seller_id);
            if (!privacyCheck.allowed) {
                return res.status(403).json({
                    success: false,
                    code: 'PRIVACY_RESTRICTED',
                    message: privacyCheck.reason || 'No puedes comprar de este vendedor'
                });
            }

            // Verificar límite diario de compra
            const dailyTotal = await inventoryService.getDailyPurchaseTotal(buyerId);
            const itemPrice = listing.price;
            const newTotal = dailyTotal + itemPrice;

            if (newTotal > MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT) {
                const remaining = Math.max(0, MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT - dailyTotal);
                return res.status(400).json({
                    success: false,
                    code: 'DAILY_LIMIT_EXCEEDED',
                    message: `Has alcanzado el límite diario de compra de $${MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT.toLocaleString()}. ` +
                             `Hoy has gastado $${dailyTotal.toFixed(2)}. ` +
                             (remaining > 0 ? `Solo puedes gastar $${remaining.toFixed(2)} más hoy.` : 'Intenta mañana.'),
                    dailyTotal: dailyTotal,
                    dailyLimit: MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT,
                    remaining: remaining,
                    itemPrice: itemPrice
                });
            }

            const result = await inventoryService.purchaseMarketplaceItem(buyerId, listingId);

            res.json({
                success: true,
                message: result.message,
                data: {
                    itemName: result.itemName,
                    pricePaid: result.pricePaid,
                    newBalance: result.newBalance,
                    transactionId: result.transactionId
                }
            });
        } catch (error) {
            console.error('Error en purchaseItem:', error);
            
            // Determinar código de estado apropiado
            let statusCode = 500;
            if (error.message.includes('Fondos insuficientes')) {
                statusCode = 402; // Payment Required
            } else if (error.message.includes('no está disponible') || 
                       error.message.includes('ya fue vendido')) {
                statusCode = 409; // Conflict
            } else if (error.message.includes('tu propio artículo')) {
                statusCode = 400; // Bad Request
            } else if (error.message.includes('ya fue procesada')) {
                statusCode = 409; // Conflict
            }

            res.status(statusCode).json({ 
                success: false, 
                message: error.message 
            });
        }
    },

    /**
     * Actualizar precio de un listing
     * Validaciones de seguridad:
     * - Usuario autenticado
     * - Usuario es dueño del listing
     * - Precio válido dentro de rango
     * - Listing activo
     */
    async updateListingPrice(req, res) {
        try {
            const userId = req.user.id;
            const { listingId, newPrice } = req.body;

            // Validación de datos requeridos
            if (!listingId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de publicación requerido' 
                });
            }

            if (newPrice === undefined || newPrice === null) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Nuevo precio requerido' 
                });
            }

            // Validar formato UUID (prevenir inyección)
            if (!isValidUUID(listingId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Formato de ID inválido' 
                });
            }

            // Validación de precio usando utilidad centralizada
            const priceValidation = validatePrice(newPrice);
            if (!priceValidation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: priceValidation.error 
                });
            }

            // Actualizar precio (service verifica ownership)
            const result = await inventoryService.updateListingPrice(userId, listingId, priceValidation.sanitizedPrice);

            res.json({
                success: true,
                message: 'Precio actualizado correctamente',
                listing: {
                    id: result.id,
                    price: result.price,
                    updated_at: result.updated_at
                }
            });
        } catch (error) {
            console.error('Error en updateListingPrice:', error);
            
            // Determinar código de estado apropiado
            let statusCode = 500;
            if (error.message.includes('no encontrada') || 
                error.message.includes('no pertenece')) {
                statusCode = 403; // Forbidden
            } else if (error.message.includes('no está activa')) {
                statusCode = 409; // Conflict
            }

            res.status(statusCode).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
};
