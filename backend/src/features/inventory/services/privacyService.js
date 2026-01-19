import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { createLogger } from '../../../shared/utils/logger.js';

const logger = createLogger('PrivacyService');

// Constantes de validación
const VALID_PRIVACY_LEVELS = ['public', 'friends', 'private'];
const VALID_PRIVACY_TYPES = ['inventory', 'trade', 'marketplace'];

// Regex para validar UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Servicio de Privacidad
 * Gestiona la configuración de privacidad del perfil y validaciones de acceso
 */
export const privacyService = {
    /**
     * Valida si un UUID es válido
     * @param {string} uuid 
     * @returns {boolean}
     */
    isValidUUID(uuid) {
        return typeof uuid === 'string' && UUID_REGEX.test(uuid);
    },

    /**
     * Valida si un nivel de privacidad es válido
     * @param {string} level 
     * @returns {boolean}
     */
    isValidPrivacyLevel(level) {
        return VALID_PRIVACY_LEVELS.includes(level);
    },

    /**
     * Obtiene la configuración de privacidad de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>} - Configuración de privacidad
     */
    async getPrivacySettings(userId) {
        if (!this.isValidUUID(userId)) {
            throw new Error('ID de usuario inválido');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('inventory_privacy, trade_privacy, marketplace_privacy')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('Error obteniendo configuración de privacidad:', { error });
            throw new Error('Error al obtener configuración de privacidad');
        }

        if (!data) {
            throw new Error('Perfil no encontrado');
        }

        // Normalizar a minúsculas para consistencia
        return {
            inventory: (data.inventory_privacy || 'public').toLowerCase(),
            trade: (data.trade_privacy || 'public').toLowerCase(),
            marketplace: (data.marketplace_privacy || 'public').toLowerCase()
        };
    },

    /**
     * Actualiza la configuración de privacidad de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} settings - { inventory?, trade?, marketplace? }
     * @returns {Promise<Object>} - Configuración actualizada
     */
    async updatePrivacySettings(userId, settings) {
        if (!this.isValidUUID(userId)) {
            throw new Error('ID de usuario inválido');
        }

        // Validar y sanitizar los settings
        const updateData = {};
        
        if (settings.inventory !== undefined) {
            if (!this.isValidPrivacyLevel(settings.inventory)) {
                throw new Error(`Nivel de privacidad de inventario inválido. Valores permitidos: ${VALID_PRIVACY_LEVELS.join(', ')}`);
            }
            updateData.inventory_privacy = settings.inventory;
        }

        if (settings.trade !== undefined) {
            if (!this.isValidPrivacyLevel(settings.trade)) {
                throw new Error(`Nivel de privacidad de intercambios inválido. Valores permitidos: ${VALID_PRIVACY_LEVELS.join(', ')}`);
            }
            updateData.trade_privacy = settings.trade;
        }

        if (settings.marketplace !== undefined) {
            if (!this.isValidPrivacyLevel(settings.marketplace)) {
                throw new Error(`Nivel de privacidad de marketplace inválido. Valores permitidos: ${VALID_PRIVACY_LEVELS.join(', ')}`);
            }
            updateData.marketplace_privacy = settings.marketplace;
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No se proporcionaron configuraciones para actualizar');
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select('inventory_privacy, trade_privacy, marketplace_privacy')
            .single();

        if (error) {
            logger.error('Error actualizando configuración de privacidad:', { error });
            throw new Error('Error al actualizar configuración de privacidad');
        }

        return {
            inventory: data.inventory_privacy,
            trade: data.trade_privacy,
            marketplace: data.marketplace_privacy
        };
    },

    /**
     * Verifica si dos usuarios son amigos
     * @param {string} userId1 
     * @param {string} userId2 
     * @returns {Promise<boolean>}
     */
    async areFriends(userId1, userId2) {
        if (!this.isValidUUID(userId1) || !this.isValidUUID(userId2)) {
            return false;
        }

        // El usuario es "amigo" de sí mismo
        if (userId1 === userId2) {
            return true;
        }

        const { data, error } = await supabase
            .from('friendships')
            .select('status')
            .or(`and(user_id1.eq.${userId1},user_id2.eq.${userId2}),and(user_id1.eq.${userId2},user_id2.eq.${userId1})`)
            .eq('status', 'accepted')
            .maybeSingle();

        if (error) {
            logger.error('Error verificando amistad:', { error });
            return false;
        }

        return !!data;
    },

    /**
     * Verifica si un usuario puede acceder a un recurso según la privacidad
     * @param {string} ownerId - Dueño del recurso
     * @param {string} viewerId - Usuario que intenta acceder (puede ser null)
     * @param {'inventory' | 'trade' | 'marketplace'} privacyType - Tipo de privacidad a verificar
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async checkAccess(ownerId, viewerId, privacyType) {
        // Validar tipo de privacidad
        if (!VALID_PRIVACY_TYPES.includes(privacyType)) {
            return { allowed: false, reason: 'Tipo de privacidad inválido' };
        }

        // Validar UUID del dueño
        if (!this.isValidUUID(ownerId)) {
            return { allowed: false, reason: 'ID de usuario inválido' };
        }

        // El dueño siempre tiene acceso
        if (viewerId && ownerId === viewerId) {
            return { allowed: true };
        }

        // Obtener configuración de privacidad
        let privacySettings;
        try {
            privacySettings = await this.getPrivacySettings(ownerId);
        } catch {
            return { allowed: false, reason: 'No se pudo verificar la configuración de privacidad' };
        }

        const privacyLevel = privacySettings[privacyType];

        switch (privacyLevel) {
            case 'public':
                return { allowed: true };
            
            case 'private':
                return { 
                    allowed: false, 
                    reason: this.getPrivateMessage(privacyType) 
                };
            
            case 'friends':
                // Si no hay viewerId (usuario no autenticado), denegar
                if (!viewerId || !this.isValidUUID(viewerId)) {
                    return { 
                        allowed: false, 
                        reason: 'Debes iniciar sesión para acceder a este contenido' 
                    };
                }

                const areFriends = await this.areFriends(ownerId, viewerId);
                if (areFriends) {
                    return { allowed: true };
                }
                return { 
                    allowed: false, 
                    reason: this.getFriendsOnlyMessage(privacyType)
                };
            
            default:
                return { allowed: false, reason: 'Configuración de privacidad desconocida' };
        }
    },

    /**
     * Genera mensaje para contenido privado
     * @param {string} privacyType 
     * @returns {string}
     */
    getPrivateMessage(privacyType) {
        const messages = {
            inventory: 'Este inventario es privado. El usuario ha restringido el acceso.',
            trade: 'Este usuario ha desactivado los intercambios. No puedes enviarle ofertas.',
            marketplace: 'Este usuario ha desactivado las compras del marketplace.'
        };
        return messages[privacyType] || 'Contenido privado';
    },

    /**
     * Genera mensaje para contenido solo amigos
     * @param {string} privacyType 
     * @returns {string}
     */
    getFriendsOnlyMessage(privacyType) {
        const messages = {
            inventory: 'Este inventario solo es visible para amigos del usuario.',
            trade: 'Este usuario solo acepta intercambios de amigos. Añádelo como amigo para poder enviarle ofertas.',
            marketplace: 'Este usuario solo acepta compras de amigos. Añádelo como amigo para comprar sus artículos.'
        };
        return messages[privacyType] || 'Solo disponible para amigos';
    },

    /**
     * Verifica acceso al inventario (wrapper para compatibilidad)
     * @param {string} viewerId 
     * @param {string} ownerId 
     * @returns {Promise<boolean>}
     */
    async canViewInventory(viewerId, ownerId) {
        const result = await this.checkAccess(ownerId, viewerId, 'inventory');
        return result.allowed;
    },

    /**
     * Verifica si se puede enviar trade a un usuario
     * @param {string} senderId - ID del que envía el trade
     * @param {string} receiverId - ID del que recibiría el trade
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async canSendTrade(senderId, receiverId) {
        return this.checkAccess(receiverId, senderId, 'trade');
    },

    /**
     * Verifica si se puede comprar del marketplace de un usuario
     * @param {string} buyerId - ID del comprador
     * @param {string} sellerId - ID del vendedor
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async canPurchaseFrom(buyerId, sellerId) {
        return this.checkAccess(sellerId, buyerId, 'marketplace');
    }
};

export default privacyService;
