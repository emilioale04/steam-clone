const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Niveles de privacidad disponibles
 */
export const PRIVACY_LEVELS = {
    PUBLIC: 'public',
    FRIENDS: 'friends',
    PRIVATE: 'private'
};

/**
 * Etiquetas legibles para los niveles de privacidad
 */
export const PRIVACY_LABELS = {
    public: 'Público',
    friends: 'Solo amigos',
    private: 'Privado'
};

/**
 * Descripciones para cada tipo de privacidad
 */
export const PRIVACY_DESCRIPTIONS = {
    inventory: {
        public: 'Cualquier persona puede ver tu inventario',
        friends: 'Solo tus amigos pueden ver tu inventario',
        private: 'Solo tú puedes ver tu inventario'
    },
    trade: {
        public: 'Cualquier persona puede enviarte ofertas de intercambio',
        friends: 'Solo tus amigos pueden enviarte ofertas de intercambio',
        private: 'No recibirás ofertas de intercambio de nadie'
    },
    marketplace: {
        public: 'Cualquier persona puede comprar tus artículos',
        friends: 'Solo tus amigos pueden comprar tus artículos',
        private: 'Nadie puede comprar tus artículos del marketplace'
    }
};

/**
 * Mensajes de error amigables para restricciones de privacidad
 */
export const PRIVACY_ERROR_MESSAGES = {
    trade: {
        private: 'Este usuario ha desactivado los intercambios',
        friends: 'Este usuario solo acepta intercambios de amigos'
    },
    marketplace: {
        private: 'Este usuario ha desactivado las compras del marketplace',
        friends: 'Este usuario solo acepta compras de amigos'
    },
    inventory: {
        private: 'Este inventario es privado',
        friends: 'Este inventario solo es visible para amigos'
    }
};

/**
 * Servicio de Privacidad
 * Gestiona las configuraciones de privacidad del perfil
 */
export const privacyService = {
    /**
     * Obtiene la configuración de privacidad del usuario autenticado
     * @returns {Promise<{inventory: string, trade: string, marketplace: string}>}
     */
    async getPrivacySettings() {
        const response = await fetch(`${API_URL}/privacy/settings`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Actualiza la configuración de privacidad
     * @param {Object} settings - { inventory?, trade?, marketplace? }
     * @returns {Promise<{inventory: string, trade: string, marketplace: string}>}
     */
    async updatePrivacySettings(settings) {
        const response = await fetch(`${API_URL}/privacy/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(settings)
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Verifica si se puede ver el inventario de un usuario
     * @param {string} userId - ID del usuario objetivo
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async checkInventoryAccess(userId) {
        const response = await fetch(`${API_URL}/privacy/check/inventory/${userId}`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Verifica si se puede enviar trade a un usuario
     * @param {string} userId - ID del usuario objetivo
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async checkTradeAccess(userId) {
        const response = await fetch(`${API_URL}/privacy/check/trade/${userId}`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Verifica si se puede comprar del marketplace de un usuario
     * @param {string} userId - ID del vendedor
     * @returns {Promise<{allowed: boolean, reason?: string}>}
     */
    async checkMarketplaceAccess(userId) {
        const response = await fetch(`${API_URL}/privacy/check/marketplace/${userId}`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    /**
     * Obtiene información completa de privacidad de un perfil
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async getProfilePrivacyInfo(userId) {
        const response = await fetch(`${API_URL}/privacy/profile/${userId}`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    }
};

export default privacyService;
