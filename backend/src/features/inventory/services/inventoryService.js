import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { privacyService } from './privacyService.js';

export const inventoryService = {
    /**
     * Valida si un usuario puede ver el inventario de otro (DAC Engine)
     * Delegado al privacyService centralizado
     * @param {string} viewerId - ID del usuario que intenta ver
     * @param {string} ownerId - ID del dueño del inventario
     * @returns {Promise<boolean>}
     */
    async canViewInventory(viewerId, ownerId) {
        return privacyService.canViewInventory(viewerId, ownerId);
    },

    /**
     * Obtiene el inventario de un usuario si el visor tiene permiso
     * @param {string} viewerId 
     * @param {string} ownerId 
     */
    async getUserInventory(viewerId, ownerId) {
        const allowed = await this.canViewInventory(viewerId, ownerId);

        if (!allowed) {
            throw new Error('No tienes permiso para ver este inventario');
        }

        // Modificamos el select para incluir datos de items_aplicaciones y listings activos
        const { data, error } = await supabase
            .from('items')
            .select(`
                id,
                owner_id,
                is_locked,
                acquired_at,
                updated_at,
                item_aplicacion_id,
                items_aplicaciones (
                    id,
                    aplicacion_id,
                    nombre,
                    is_tradeable,
                    is_marketable,
                    activo
                ),
                marketplace_listings (
                    id, 
                    price, 
                    status
                )
            `)
            .eq('owner_id', ownerId);

        if (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }

        // Obtener trades activos del usuario (donde el item está en intercambio)
        const { data: activeTrades, error: tradesError } = await supabase
            .from('trade')
            .select('id, item_id, status')
            .eq('offerer_id', ownerId)
            .eq('status', 'Pendiente');

        if (tradesError) {
            console.error('Error fetching active trades:', tradesError);
        }

        // Obtener trade_offers activos del usuario
        const { data: activeTradeOffers, error: offersError } = await supabase
            .from('trade_offer')
            .select('id, item_id, trade_id, status')
            .eq('offerer_id', ownerId)
            .eq('status', 'Pendiente');

        if (offersError) {
            console.error('Error fetching active trade offers:', offersError);
        }

        // Crear mapas para búsqueda rápida
        const tradesMap = new Map();
        activeTrades?.forEach(trade => {
            tradesMap.set(trade.item_id, trade);
        });

        const offersMap = new Map();
        activeTradeOffers?.forEach(offer => {
            offersMap.set(offer.item_id, offer);
        });

        // Procesamos para aplanar la estructura y mantener compatibilidad
        return data.map(item => {
            const activeListing = item.marketplace_listings?.find(l => l.status === 'Active');
            const activeTrade = tradesMap.get(item.id) || null;
            const activeTradeOffer = offersMap.get(item.id) || null;
            
            // Aplanar la estructura para compatibilidad con frontend
            // Nota: items_aplicaciones viene del join con la tabla del mismo nombre
            const itemApp = item.items_aplicaciones;
            const { marketplace_listings, items_aplicaciones, ...itemFields } = item;
            
            return {
                ...itemFields,
                // Datos de la plantilla del item (items_aplicaciones)
                name: itemApp?.nombre,
                is_tradeable: itemApp?.is_tradeable,
                is_marketable: itemApp?.is_marketable,
                activo: itemApp?.activo,
                aplicacion_id: itemApp?.aplicacion_id,
                item_aplicacion_id: itemApp?.id,
                // Estados activos
                active_listing: activeListing || null,
                active_trade: activeTrade,
                active_trade_offer: activeTradeOffer
            };
        });
    },

    /**
     * Obtiene un item específico por ID
     * @param {string} itemId 
     * @param {string} viewerId 
     */
    async getItemById(itemId, viewerId) {
        const { data: item, error } = await supabase
            .from('items')
            .select(`
                id,
                owner_id,
                is_locked,
                acquired_at,
                updated_at,
                item_aplicacion_id,
                items_aplicaciones (
                    id,
                    aplicacion_id,
                    nombre,
                    is_tradeable,
                    is_marketable,
                    activo
                )
            `)
            .eq('id', itemId)
            .single();

        if (error) throw error;
        if (!item) throw new Error('Item no encontrado');

        const allowed = await this.canViewInventory(viewerId, item.owner_id);
        if (!allowed) {
            throw new Error('No tienes permiso para ver este item');
        }

        // Aplanar la estructura para compatibilidad
        const itemApp = item.items_aplicaciones;
        const { items_aplicaciones, ...itemFields } = item;
        
        return {
            ...itemFields,
            name: itemApp?.nombre,
            is_tradeable: itemApp?.is_tradeable,
            is_marketable: itemApp?.is_marketable,
            activo: itemApp?.activo,
            aplicacion_id: itemApp?.aplicacion_id,
            item_aplicacion_id: itemApp?.id
        };
    },

    /**
     * Sincroniza el inventario local con Steam (Simulación de API central)
     * Ahora usa la nueva estructura con items_aplicaciones
     * @param {string} userId 
     * @param {Array} steamItems - Items con item_aplicacion_id
     */
    async syncWithSteam(userId, steamItems) {
        // 1. Obtener items actuales del usuario
        const { data: currentItems } = await supabase
            .from('items')
            .select('id, item_aplicacion_id')
            .eq('owner_id', userId);

        const currentAppIds = currentItems?.map(item => item.item_aplicacion_id).filter(Boolean) || [];

        // 2. Identificar nuevos items (item_aplicacion_ids que el usuario no tiene)
        const newAppIds = steamItems
            .map(item => item.item_aplicacion_id)
            .filter(appId => !currentAppIds.includes(appId));

        if (newAppIds.length === 0) {
            return { success: true, syncedCount: 0 };
        }

        // 3. Verificar que los item_aplicacion_ids existen y están activos
        const { data: validApps, error: appError } = await supabase
            .from('items_aplicaciones')
            .select('id')
            .in('id', newAppIds)
            .eq('activo', true);

        if (appError) throw appError;

        if (validApps && validApps.length > 0) {
            // 4. Crear las instancias de items para el usuario
            const { error } = await supabase
                .from('items')
                .insert(
                    validApps.map(app => ({
                        owner_id: userId,
                        item_aplicacion_id: app.id,
                        is_locked: false
                    }))
                );

            if (error) throw error;
        }

        return {
            success: true,
            syncedCount: validApps?.length || 0
        };
    },

    /**
     * Cuenta los listings activos de un usuario
     */
    async countActiveListings(userId) {
        const { count, error } = await supabase
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', userId)
            .eq('status', 'active');

        if (error) {
            console.error('Error contando listings activos:', error);
            throw new Error(error.message);
        }

        return count || 0;
    },

    /**
     * Pone un item a la venta usando una transacción DB (ACID Compliant)
     */
    async listForSale(userId, itemId, price) {
        // Llamada a la RPC (Remote Procedure Call) de Supabase
        const { data, error } = await supabase.rpc('create_listing_transaction', {
            p_user_id: userId,
            p_item_id: itemId,
            p_price: price
        });

        if (error) {
            console.error('Error en transacción venta:', error);
            throw new Error(error.message);
        }

        // Mapear resultado
        return {
             id: data.id,
             price: data.price,
             listing_price: data.price, // Compatibilidad frontend
             listing_date: data.listing_date,
             created_at: data.listing_date, // Compatibilidad
             name: data.name,
             seller_id: data.seller_id
        }; 
    },

    /**
     * Cancela una venta activa usando una transacción DB (ACID Compliant)
     */
    async cancelListing(userId, listingId) {
        // Llamada a la RPC de Supabase
        const { error } = await supabase.rpc('cancel_listing_transaction', {
            p_listing_id: listingId,
            p_user_id: userId
        });

        if (error) {
            console.error('Error en transacción cancelación:', error);
            throw new Error(error.message);
        }

        return true;
    },

    /**
     * Actualiza el precio de un listing activo
     * Verificación de ownership incluida para seguridad
     * @param {string} userId - ID del usuario (debe ser el dueño)
     * @param {string} listingId - ID del listing
     * @param {number} newPrice - Nuevo precio (ya sanitizado)
     */
    async updateListingPrice(userId, listingId, newPrice) {
        // Primero verificamos que el listing exista y pertenezca al usuario
        const { data: listing, error: fetchError } = await supabase
            .from('marketplace_listings')
            .select('id, seller_id, status, price')
            .eq('id', listingId)
            .single();

        if (fetchError || !listing) {
            throw new Error('Publicación no encontrada');
        }

        // Verificar ownership (CRÍTICO para seguridad)
        if (listing.seller_id !== userId) {
            console.warn(`Intento no autorizado de actualizar precio. User: ${userId}, Listing owner: ${listing.seller_id}`);
            throw new Error('Esta publicación no te pertenece');
        }

        // Verificar que esté activa
        if (listing.status !== 'Active') {
            throw new Error('Esta publicación ya no está activa');
        }

        // Verificar que el precio sea diferente (evitar updates innecesarios)
        if (listing.price === newPrice) {
            return {
                id: listing.id,
                price: listing.price,
                updated_at: new Date().toISOString(),
                unchanged: true
            };
        }

        // Actualizar el precio
        const { data: updated, error: updateError } = await supabase
            .from('marketplace_listings')
            .update({ 
                price: newPrice,
                updated_at: new Date().toISOString()
            })
            .eq('id', listingId)
            .eq('seller_id', userId) // Doble verificación de seguridad
            .eq('status', 'Active')
            .select('id, price, updated_at')
            .single();

        if (updateError) {
            console.error('Error actualizando precio:', updateError);
            throw new Error('Error al actualizar el precio');
        }

        if (!updated) {
            throw new Error('No se pudo actualizar el precio');
        }

        return updated;
    },

    /**
     * Obtiene todos los items listados en el mercado
     * Usa la nueva estructura con items_aplicaciones
     */
    async getMarketListings() {
        // Obtenemos listings activos con datos del item, items_aplicaciones y del vendedor
        const { data, error } = await supabase
            .from('marketplace_listings')
            .select(`
                id,
                price,
                created_at,
                seller_id,
                items:item_id (
                    id,
                    is_locked,
                    items_aplicaciones (
                        id,
                        nombre,
                        is_tradeable,
                        is_marketable,
                        aplicacion_id
                    )
                ),
                profiles:seller_id (
                    username
                )
            `)
            .eq('status', 'Active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching market listings:', error);
            throw error;
        }

        // Mapear para estructura que espera el frontend
        return data.map(listing => {
            const itemApp = listing.items?.items_aplicaciones;
            return {
                id: listing.id, // ID del listing, no del item
                itemId: listing.items?.id,
                item_aplicacion_id: itemApp?.id,
                name: itemApp?.nombre || 'Item',
                price: listing.price,
                seller: listing.profiles?.username || 'Desconocido',
                seller_id: listing.seller_id,
                sellerValid: true,
                is_tradeable: itemApp?.is_tradeable,
                is_marketable: itemApp?.is_marketable,
                aplicacion_id: itemApp?.aplicacion_id,
                listing_date: listing.created_at
            };
        });
    },

    /**
     * Obtiene ofertas de intercambio activas
     */
    async getActiveTrades() {
        return []; 
    },

    /**
     * Obtiene el total de compras del día para un usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<number>} Total gastado hoy
     */
    async getDailyPurchaseTotal(userId) {
        // Obtener inicio del día en UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'purchase')
            .eq('status', 'completed')
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('Error obteniendo compras del día:', error);
            return 0;
        }

        // Sumar todas las compras (amount es negativo en compras)
        const total = data.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return total;
    },

    /**
     * Compra un item del marketplace de forma atómica y segura
     * Source of Truth: El precio se obtiene de la DB, NO del cliente
     * @param {string} buyerId - ID del comprador
     * @param {string} listingId - ID del listing en el marketplace
     * @returns {Promise<Object>} Resultado de la compra
     */
    async purchaseMarketplaceItem(buyerId, listingId) {
        // Validaciones básicas
        if (!buyerId || !listingId) {
            throw new Error('Datos de compra incompletos');
        }

        // Generar idempotency key única para esta compra
        const idempotencyKey = `purchase_${buyerId}_${listingId}_${Date.now()}`;

        // Usar función RPC para transacción atómica
        // El precio se obtiene DIRECTAMENTE de la DB, ignorando cualquier valor del cliente
        const { data, error } = await supabase.rpc('purchase_marketplace_item', {
            p_buyer_id: buyerId,
            p_listing_id: listingId,
            p_idempotency_key: idempotencyKey
        });

        if (error) {
            console.error('Error en purchase_marketplace_item RPC:', error);
            
            // Manejar errores específicos de forma amigable
            if (error.message.includes('Fondos insuficientes')) {
                throw new Error(error.message);
            }
            if (error.message.includes('ya no está disponible')) {
                throw new Error('Este artículo ya fue vendido o retirado del mercado');
            }
            if (error.message.includes('tu propio artículo')) {
                throw new Error('No puedes comprar tu propio artículo');
            }
            if (error.message.includes('ya fue procesada')) {
                throw new Error('Esta compra ya fue procesada');
            }
            
            throw new Error(error.message || 'Error al procesar la compra');
        }

        return {
            success: true,
            message: data.message || 'Compra realizada exitosamente',
            itemName: data.item_name,
            pricePaid: data.price_paid,
            newBalance: data.buyer_new_balance,
            transactionId: data.buyer_transaction_id,
            sellerReceived: data.seller_receives,
            commission: data.commission
        };
    }
};
