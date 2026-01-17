const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Genera un identificador único para operaciones idempotentes
 * @param {string} prefix - Prefijo para el identificador
 * @returns {string}
 */
const generateIdempotencyKey = (prefix = 'op') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const walletService = {
    /**
     * Obtiene el balance actual del usuario
     * @returns {Promise<number>}
     */
    async getBalance() {
        const response = await fetch(`${API_URL}/wallet/balance`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data.balance;
    },

    /**
     * Recarga la billetera
     * @param {number} amount - Monto a recargar (1 - 500)
     * @returns {Promise<{newBalance: number, transactionId: string}>}
     */
    async reloadWallet(amount) {
        // Generar idempotency key para prevenir duplicados
        const idempotencyKey = generateIdempotencyKey('reload');

        const response = await fetch(`${API_URL}/wallet/reload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                amount: parseFloat(amount),
                idempotencyKey 
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return {
            newBalance: data.data.newBalance,
            transactionId: data.data.transactionId
        };
    },

    /**
     * Procesa un pago
     * @param {number} amount - Monto a pagar
     * @param {string} description - Descripción del pago
     * @param {string} referenceType - Tipo de referencia (game, item, etc)
     * @param {string} referenceId - ID del elemento
     * @returns {Promise<{newBalance: number, transactionId: string}>}
     */
    async processPayment(amount, description, referenceType = null, referenceId = null) {
        // Generar idempotency key OBLIGATORIO para pagos
        const idempotencyKey = generateIdempotencyKey(`pay_${referenceType || 'generic'}_${referenceId || 'none'}`);

        const response = await fetch(`${API_URL}/wallet/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                amount: parseFloat(amount),
                description,
                referenceType,
                referenceId,
                idempotencyKey
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return {
            newBalance: data.data.newBalance,
            transactionId: data.data.transactionId
        };
    },

    /**
     * Obtiene el historial de transacciones
     * @param {number} limit - Límite de resultados
     * @param {number} offset - Offset para paginación
     * @returns {Promise<{transactions: Array, pagination: Object}>}
     */
    async getTransactionHistory(limit = 20, offset = 0) {
        const response = await fetch(
            `${API_URL}/wallet/history?limit=${limit}&offset=${offset}`,
            { credentials: 'include' }
        );

        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        
        return {
            transactions: data.data.transactions,
            pagination: data.data.pagination
        };
    },

    /**
     * Helper para generar idempotency key (exportado para uso externo)
     */
    generateIdempotencyKey
};
