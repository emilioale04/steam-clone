import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const inventoryService = {
    /**
     * Valida si un usuario puede ver el inventario de otro (DAC Engine)
     * @param {string} viewerId - ID del usuario que intenta ver
     * @param {string} ownerId - ID del dueño del inventario
     * @returns {Promise<boolean>}
     */
    async canViewInventory(viewerId, ownerId) {
        if (viewerId === ownerId) return true;

        // Obtener la privacidad del perfil del dueño
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('inventory_privacy')
            .eq('id', ownerId)
            .single();

        if (profileError || !profile) return false;

        const privacy = profile.inventory_privacy;

        if (privacy === 'Public') return true;
        if (privacy === 'Private') return false;

        if (privacy === 'Friends') {
            if (!viewerId) return false;

            // Verificar si son amigos en la tabla friendships
            const { data: friendship, error: friendshipError } = await supabase
                .from('friendships')
                .select('status')
                .or(`and(user_id1.eq.${viewerId},user_id2.eq.${ownerId}),and(user_id1.eq.${ownerId},user_id2.eq.${viewerId})`)
                .eq('status', 'accepted')
                .single();

            return !!friendship;
        }

        return false;
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

        // Modificamos el select para incluir listings activos
        // marketplace_listings devuleve un array, filtramos en JS o asumimos que solo hay 1 activo
        const { data, error } = await supabase
            .from('items')
            .select(`
                *,
                marketplace_listings (
                    id, 
                    price, 
                    status
                )
            `)
            .eq('owner_id', ownerId);

        if (error) throw error;

        // Procesamos para dejar solo el listing activo en una propiedad
        return data.map(item => {
            const activeListing = item.marketplace_listings?.find(l => l.status === 'Active');
            // Limpiamos la propiedad original para no enviar basura
            const { marketplace_listings, ...itemFields } = item;
            
            return {
                ...itemFields,
                active_listing: activeListing || null
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
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;
        if (!item) throw new Error('Item no encontrado');

        const allowed = await this.canViewInventory(viewerId, item.owner_id);
        if (!allowed) {
            throw new Error('No tienes permiso para ver este item');
        }

        return item;
    },

    /**
     * Sincroniza el inventario local con Steam (Simulación de API central)
     * @param {string} userId 
     * @param {Array} steamItems - Items de Steam con estructura { steam_item_id, is_tradeable, is_marketable }
     */
    async syncWithSteam(userId, steamItems) {
        // 1. Obtener items actuales del usuario
        const { data: currentItems } = await supabase
            .from('items')
            .select('steam_item_id')
            .eq('owner_id', userId);

        const currentSteamIds = currentItems?.map(item => item.steam_item_id) || [];

        // 2. Identificar nuevos items
        const newItems = steamItems.filter(item => !currentSteamIds.includes(item.steam_item_id));

        if (newItems.length > 0) {
            const { error } = await supabase
                .from('items')
                .insert(
                    newItems.map(item => ({
                        owner_id: userId,
                        steam_item_id: item.steam_item_id,
                        is_tradeable: item.is_tradeable ?? true,
                        is_marketable: item.is_marketable ?? true,
                        is_locked: item.is_locked ?? false
                    }))
                );

            if (error) throw error;
        }

        return {
            success: true,
            syncedCount: newItems.length
        };
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
            console.error("Error en transacción venta:", error);
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
            console.error("Error en transacción cancelación:", error);
            throw new Error(error.message);
        }

        return true;
    },

    /**
     * Obtiene todos los items listados en el mercado
     */
    async getMarketListings() {
        // Obtenemos listings activos con datos del item y del vendedor
        const { data, error } = await supabase
            .from('marketplace_listings')
            .select(`
                id,
                price,
                created_at,
                seller_id,
                items:item_id (
                    id,
                    name, 
                    steam_item_id,
                    is_tradeable,
                    is_marketable
                ),
                profiles:seller_id (
                    username
                )
            `)
            .eq('status', 'Active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching market listings:", error);
            throw error;
        }

        // Mapear para estructura que espera el frontend
        return data.map(listing => ({
            id: listing.id, // ID del listing, no del item
            itemId: listing.items?.id,
            steam_item_id: listing.items?.steam_item_id,
            name: listing.items?.name || `Item`,
            price: listing.price,
            seller: listing.profiles?.username || 'Desconocido',
            seller_id: listing.seller_id, // Agregamos el ID del vendedor para validación
            sellerValid: true,
            image: null, // Si tuvieras columna de imagen
            is_tradeable: listing.items?.is_tradeable,
            is_marketable: listing.items?.is_marketable,
            listing_date: listing.created_at
        }));
    },

    /**
     * Obtiene ofertas de intercambio activas
     */
    async getActiveTrades() {
        return []; 
    }
};
