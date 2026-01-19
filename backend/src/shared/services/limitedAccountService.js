import { supabaseAdmin as supabase } from '../config/supabase.js';

/**
 * Configuración de cuenta limitada
 */
export const LIMITED_ACCOUNT_CONFIG = {
    // Monto mínimo de recarga para desbloquear cuenta
    UNLOCK_AMOUNT: 5.00,
    
    // Operaciones restringidas para cuentas limitadas
    RESTRICTED_OPERATIONS: [
        'purchase',      // Comprar en marketplace
        'sell',          // Vender en marketplace
        'trade',         // Crear intercambios
        'trade_offer',   // Enviar ofertas de intercambio
    ]
};

/**
 * Mensajes de error amigables para cuentas limitadas
 */
export const LIMITED_ACCOUNT_MESSAGES = {
    generic: 'Tu cuenta está limitada. Recarga al menos $5.00 en tu billetera para desbloquear todas las funciones.',
    purchase: 'No puedes comprar artículos con una cuenta limitada. Recarga al menos $5.00 para habilitar las compras.',
    sell: 'No puedes vender artículos con una cuenta limitada. Recarga al menos $5.00 para habilitar las ventas.',
    trade: 'No puedes crear intercambios con una cuenta limitada. Recarga al menos $5.00 para habilitar los intercambios.',
    trade_offer: 'No puedes enviar ofertas de intercambio con una cuenta limitada. Recarga al menos $5.00 para participar en intercambios.',
    privacy: 'No puedes modificar la configuración de privacidad con una cuenta limitada. Recarga al menos $5.00 primero.'
};

/**
 * Servicio de Cuenta Limitada
 * Gestiona el estado de limitación de cuentas y su desbloqueo
 */
export const limitedAccountService = {
    /**
     * Verifica si una cuenta está limitada
     * @param {string} userId - ID del usuario
     * @returns {Promise<boolean>} - true si está limitada
     */
    async isAccountLimited(userId) {
        if (!userId) return true;

        const { data, error } = await supabase
            .from('profiles')
            .select('is_limited')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error verificando cuenta limitada:', error);
            return true; // Por seguridad, asumir limitada si hay error
        }

        return data?.is_limited ?? true;
    },

    /**
     * Obtiene el total recargado históricamente por un usuario
     * @param {string} userId 
     * @returns {Promise<number>}
     */
    async getTotalReloaded(userId) {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'reload')
            .eq('status', 'completed');

        if (error) {
            console.error('Error obteniendo total recargado:', error);
            return 0;
        }

        return data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    },

    /**
     * Verifica si el usuario cumple los requisitos para desbloquear
     * @param {string} userId 
     * @returns {Promise<{eligible: boolean, totalReloaded: number, remaining: number}>}
     */
    async checkUnlockEligibility(userId) {
        const totalReloaded = await this.getTotalReloaded(userId);
        const remaining = Math.max(0, LIMITED_ACCOUNT_CONFIG.UNLOCK_AMOUNT - totalReloaded);
        
        return {
            eligible: totalReloaded >= LIMITED_ACCOUNT_CONFIG.UNLOCK_AMOUNT,
            totalReloaded,
            remaining,
            unlockAmount: LIMITED_ACCOUNT_CONFIG.UNLOCK_AMOUNT
        };
    },

    /**
     * Desbloquea una cuenta si cumple los requisitos
     * @param {string} userId 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async unlockAccountIfEligible(userId) {
        // Verificar si ya está desbloqueada
        const isLimited = await this.isAccountLimited(userId);
        if (!isLimited) {
            return { 
                success: true, 
                message: 'Tu cuenta ya está desbloqueada',
                alreadyUnlocked: true
            };
        }

        // Verificar elegibilidad
        const eligibility = await this.checkUnlockEligibility(userId);
        
        if (!eligibility.eligible) {
            return {
                success: false,
                message: `Necesitas recargar $${eligibility.remaining.toFixed(2)} más para desbloquear tu cuenta.`,
                remaining: eligibility.remaining
            };
        }

        // Desbloquear cuenta
        const { error } = await supabase
            .from('profiles')
            .update({ 
                is_limited: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error desbloqueando cuenta:', error);
            return {
                success: false,
                message: 'Error al desbloquear la cuenta. Intenta de nuevo.'
            };
        }

        return {
            success: true,
            message: '¡Felicidades! Tu cuenta ha sido desbloqueada. Ya puedes comprar, vender e intercambiar.',
            justUnlocked: true
        };
    },

    /**
     * Obtiene el estado completo de la cuenta para el frontend
     * @param {string} userId 
     * @returns {Promise<Object>}
     */
    async getAccountStatus(userId) {
        const [isLimited, eligibility] = await Promise.all([
            this.isAccountLimited(userId),
            this.checkUnlockEligibility(userId)
        ]);

        return {
            isLimited,
            totalReloaded: eligibility.totalReloaded,
            unlockAmount: LIMITED_ACCOUNT_CONFIG.UNLOCK_AMOUNT,
            remaining: eligibility.remaining,
            canUnlock: eligibility.eligible && isLimited,
            restrictedOperations: isLimited ? LIMITED_ACCOUNT_CONFIG.RESTRICTED_OPERATIONS : []
        };
    },

    /**
     * Obtiene el mensaje de error apropiado para una operación
     * @param {string} operation 
     * @returns {string}
     */
    getErrorMessage(operation) {
        return LIMITED_ACCOUNT_MESSAGES[operation] || LIMITED_ACCOUNT_MESSAGES.generic;
    }
};

export default limitedAccountService;
