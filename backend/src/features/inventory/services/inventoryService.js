import supabase from '../../../shared/config/supabase.js';

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

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;
        return data;
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
    }
};
