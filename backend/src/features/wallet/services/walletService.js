import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { limitedAccountService } from '../../../shared/services/limitedAccountService.js';

/**
 * Wallet Service
 * Maneja operaciones de billetera con protección contra condiciones de carrera
 * usando bloqueos de fila con FOR UPDATE en transacciones de Supabase
 */
export const walletService = {
    // Configuración de límites
    LIMITS: {
        MIN_RELOAD_AMOUNT: 1.00,
        MAX_RELOAD_AMOUNT: 500.00,
        MAX_BALANCE: 10000.00,
        MAX_DAILY_RELOAD: 1000.00,
        MIN_PURCHASE_AMOUNT: 0.01,
        RELOAD_COOLDOWN_MS: 5000, // 5 segundos entre recargas
    },

    // Cache de operaciones recientes para prevenir duplicados
    _recentOperations: new Map(),

    /**
     * Genera un idempotency key único para la operación
     * @param {string} userId 
     * @param {string} operation 
     * @param {number} amount 
     * @returns {string}
     */
    _generateIdempotencyKey(userId, operation, amount) {
        return `${userId}:${operation}:${amount}:${Math.floor(Date.now() / 1000)}`;
    },

    /**
     * Verifica si una operación ya está en proceso (previene doble-click)
     * @param {string} userId 
     * @param {string} operation 
     * @returns {boolean}
     */
    _isOperationInProgress(userId, operation) {
        const key = `${userId}:${operation}`;
        const lastOp = this._recentOperations.get(key);
        
        if (lastOp && (Date.now() - lastOp) < this.LIMITS.RELOAD_COOLDOWN_MS) {
            return true;
        }
        
        this._recentOperations.set(key, Date.now());
        
        // Limpiar operaciones antiguas periódicamente
        if (this._recentOperations.size > 1000) {
            const now = Date.now();
            for (const [k, v] of this._recentOperations.entries()) {
                if (now - v > 60000) this._recentOperations.delete(k);
            }
        }
        
        return false;
    },

    /**
     * Libera el bloqueo de operación
     * @param {string} userId 
     * @param {string} operation 
     */
    _releaseOperationLock(userId, operation) {
        const key = `${userId}:${operation}`;
        this._recentOperations.delete(key);
    },

    /**
     * Valida el monto de recarga
     * @param {number} amount 
     * @throws {Error} si el monto no es válido
     */
    _validateReloadAmount(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('El monto debe ser un número válido');
        }
        
        if (amount < this.LIMITS.MIN_RELOAD_AMOUNT) {
            throw new Error(`El monto mínimo de recarga es $${this.LIMITS.MIN_RELOAD_AMOUNT.toFixed(2)}`);
        }
        
        if (amount > this.LIMITS.MAX_RELOAD_AMOUNT) {
            throw new Error(`El monto máximo de recarga es $${this.LIMITS.MAX_RELOAD_AMOUNT.toFixed(2)}`);
        }
        
        // Validar que tenga máximo 2 decimales
        if (Math.round(amount * 100) !== amount * 100) {
            throw new Error('El monto debe tener máximo 2 decimales');
        }
    },

    /**
     * Valida el monto de compra
     * @param {number} amount 
     * @throws {Error} si el monto no es válido
     */
    _validatePurchaseAmount(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('El monto debe ser un número válido');
        }
        
        if (amount < this.LIMITS.MIN_PURCHASE_AMOUNT) {
            throw new Error('El monto de compra no es válido');
        }
        
        // Validar que tenga máximo 2 decimales
        if (Math.round(amount * 100) !== amount * 100) {
            throw new Error('El monto debe tener máximo 2 decimales');
        }
    },

    /**
     * Obtiene el balance actual del usuario
     * @param {string} userId 
     * @returns {Promise<number>}
     */
    async getBalance(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error('Error al obtener el balance');
        }

        return data?.balance || 0;
    },

    /**
     * Obtiene el historial de recargas del día para el usuario
     * @param {string} userId 
     * @returns {Promise<number>} Total recargado hoy
     */
    async getDailyReloadTotal(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'reload')
            .eq('status', 'completed')
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('Error al obtener recargas diarias:', error);
            return 0;
        }

        return data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    },

    /**
     * Recarga la billetera del usuario
     * Usa transacción con bloqueo de fila para prevenir condiciones de carrera
     * 
     * @param {string} userId - ID del usuario
     * @param {number} amount - Monto a recargar
     * @param {string} idempotencyKey - Clave única para prevenir duplicados
     * @returns {Promise<{success: boolean, newBalance: number, transactionId: string}>}
     */
    async reloadWallet(userId, amount, idempotencyKey = null) {
        // Prevenir operaciones duplicadas por doble-click
        if (this._isOperationInProgress(userId, 'reload')) {
            throw new Error('Operación en proceso. Espera unos segundos antes de intentar de nuevo.');
        }

        try {
            // Validar monto
            this._validateReloadAmount(amount);

            // Verificar idempotency key si se proporciona
            if (idempotencyKey) {
                const { data: existingTx } = await supabase
                    .from('wallet_transactions')
                    .select('id, status')
                    .eq('idempotency_key', idempotencyKey)
                    .single();

                if (existingTx) {
                    if (existingTx.status === 'completed') {
                        throw new Error('Esta transacción ya fue procesada');
                    }
                    throw new Error('Transacción duplicada detectada');
                }
            }

            // Verificar límite diario
            const dailyTotal = await this.getDailyReloadTotal(userId);
            if (dailyTotal + amount > this.LIMITS.MAX_DAILY_RELOAD) {
                const remaining = this.LIMITS.MAX_DAILY_RELOAD - dailyTotal;
                throw new Error(
                    'Has alcanzado el límite diario de recarga. ' +
                    `Puedes recargar hasta $${remaining.toFixed(2)} más hoy.`
                );
            }

            // Usar función RPC para transacción atómica con bloqueo
            // Esto previene condiciones de carrera al bloquear la fila durante la actualización
            const { data, error } = await supabase.rpc('reload_wallet', {
                p_user_id: userId,
                p_amount: amount,
                p_idempotency_key: idempotencyKey || `auto_${userId}_${Date.now()}`,
                p_max_balance: this.LIMITS.MAX_BALANCE
            });

            if (error) {
                console.error('Error en reload_wallet RPC:', error);
                
                // Fallback a transacción manual si RPC no existe
                if (error.code === 'PGRST202' || error.message.includes('not find')) {
                    return await this._reloadWalletFallback(userId, amount, idempotencyKey);
                }
                
                throw new Error(error.message || 'Error al procesar la recarga');
            }

            // Intentar desbloquear cuenta si cumple requisitos
            const unlockResult = await limitedAccountService.unlockAccountIfEligible(userId);

            return {
                success: true,
                newBalance: data.new_balance,
                transactionId: data.transaction_id,
                accountUnlocked: unlockResult.justUnlocked || false,
                unlockMessage: unlockResult.justUnlocked ? unlockResult.message : null
            };
        } finally {
            // Liberar el bloqueo después de un tiempo
            setTimeout(() => {
                this._releaseOperationLock(userId, 'reload');
            }, this.LIMITS.RELOAD_COOLDOWN_MS);
        }
    },

    /**
     * Fallback para recarga sin función RPC
     * Usa transacción optimista con verificación
     * @private
     */
    async _reloadWalletFallback(userId, amount, idempotencyKey) {
        const txKey = idempotencyKey || `auto_${userId}_${Date.now()}`;

        // 1. Obtener balance actual
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (profileError) {
            throw new Error('Error al obtener perfil del usuario');
        }

        const currentBalance = profile?.balance || 0;
        const newBalance = currentBalance + amount;

        // Verificar límite máximo
        if (newBalance > this.LIMITS.MAX_BALANCE) {
            throw new Error(
                `El balance resultante excedería el límite máximo de $${this.LIMITS.MAX_BALANCE.toFixed(2)}. ` +
                `Tu balance actual es $${currentBalance.toFixed(2)}.`
            );
        }

        // 2. Crear transacción en estado pending
        const { data: transaction, error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
                user_id: userId,
                type: 'reload',
                amount: amount,
                status: 'pending',
                idempotency_key: txKey,
                description: 'Recarga de billetera'
            })
            .select('id')
            .single();

        if (txError) {
            if (txError.code === '23505') { // Unique violation
                throw new Error('Transacción duplicada detectada');
            }
            throw new Error('Error al crear transacción');
        }

        // 3. Actualizar balance con verificación de concurrencia
        // Usamos el balance actual como condición para detectar cambios concurrentes
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('balance', currentBalance) // Condición optimista
            .select('balance')
            .single();

        if (updateError || !updatedProfile) {
            // Marcar transacción como fallida
            await supabase
                .from('wallet_transactions')
                .update({ status: 'failed' })
                .eq('id', transaction.id);

            throw new Error('Error de concurrencia. Por favor, intenta de nuevo.');
        }

        // 4. Marcar transacción como completada
        await supabase
            .from('wallet_transactions')
            .update({ 
                status: 'completed',
                balance_after: newBalance
            })
            .eq('id', transaction.id);

        // Intentar desbloquear cuenta si cumple requisitos
        const unlockResult = await limitedAccountService.unlockAccountIfEligible(userId);

        return {
            success: true,
            newBalance: newBalance,
            transactionId: transaction.id,
            accountUnlocked: unlockResult.justUnlocked || false,
            unlockMessage: unlockResult.justUnlocked ? unlockResult.message : null
        };
    },

    /**
     * Procesa un pago (resta del balance)
     * Usa transacción atómica para prevenir condiciones de carrera
     * 
     * @param {string} userId - ID del usuario
     * @param {number} amount - Monto a pagar
     * @param {string} description - Descripción de la compra
     * @param {string} referenceType - Tipo de referencia (game, item, etc)
     * @param {string} referenceId - ID del elemento comprado
     * @param {string} idempotencyKey - Clave única para prevenir compras duplicadas
     * @returns {Promise<{success: boolean, newBalance: number, transactionId: string}>}
     */
    async processPayment(userId, amount, description, referenceType = null, referenceId = null, idempotencyKey) {
        // El idempotency key es OBLIGATORIO para pagos
        if (!idempotencyKey) {
            throw new Error('Se requiere un identificador único para el pago');
        }

        // Prevenir operaciones duplicadas por doble-click
        const operationKey = `pay_${idempotencyKey}`;
        if (this._isOperationInProgress(userId, operationKey)) {
            throw new Error('Pago en proceso. No realices múltiples clicks.');
        }

        try {
            // Validar monto
            this._validatePurchaseAmount(amount);

            // Verificar si el pago ya fue procesado (idempotency)
            const { data: existingTx } = await supabase
                .from('wallet_transactions')
                .select('id, status')
                .eq('idempotency_key', idempotencyKey)
                .single();

            if (existingTx) {
                if (existingTx.status === 'completed') {
                    throw new Error('Este pago ya fue procesado anteriormente');
                }
                if (existingTx.status === 'pending') {
                    throw new Error('Este pago está siendo procesado');
                }
            }

            // Usar función RPC para transacción atómica
            const { data, error } = await supabase.rpc('process_payment', {
                p_user_id: userId,
                p_amount: amount,
                p_description: description,
                p_idempotency_key: idempotencyKey,
                p_reference_type: referenceType,
                p_reference_id: referenceId
            });

            if (error) {
                console.error('Error en process_payment RPC:', error);
                
                // Fallback si RPC no existe
                if (error.code === 'PGRST202' || error.message.includes('not find')) {
                    return await this._processPaymentFallback(
                        userId, amount, description, referenceType, referenceId, idempotencyKey
                    );
                }
                
                throw new Error(error.message || 'Error al procesar el pago');
            }

            return {
                success: true,
                newBalance: data.new_balance,
                transactionId: data.transaction_id
            };
        } finally {
            setTimeout(() => {
                this._releaseOperationLock(userId, operationKey);
            }, 3000);
        }
    },

    /**
     * Fallback para pago sin función RPC
     * @private
     */
    async _processPaymentFallback(userId, amount, description, referenceType, referenceId, idempotencyKey) {
        // 1. Obtener balance actual
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (profileError) {
            throw new Error('Error al obtener perfil del usuario');
        }

        const currentBalance = profile?.balance || 0;

        // Verificar fondos suficientes
        if (currentBalance < amount) {
            throw new Error(
                `Fondos insuficientes. Tu balance es $${currentBalance.toFixed(2)} ` +
                `y el precio es $${amount.toFixed(2)}.`
            );
        }

        const newBalance = currentBalance - amount;

        // 2. Crear transacción en estado pending
        const { data: transaction, error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
                user_id: userId,
                type: 'purchase',
                amount: -amount, // Negativo para compras
                status: 'pending',
                idempotency_key: idempotencyKey,
                description: description,
                reference_type: referenceType,
                reference_id: referenceId
            })
            .select('id')
            .single();

        if (txError) {
            if (txError.code === '23505') {
                throw new Error('Esta compra ya fue procesada');
            }
            throw new Error('Error al crear transacción de pago');
        }

        // 3. Actualizar balance con verificación optimista
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('balance', currentBalance)
            .select('balance')
            .single();

        if (updateError || !updatedProfile) {
            // Marcar transacción como fallida
            await supabase
                .from('wallet_transactions')
                .update({ status: 'failed' })
                .eq('id', transaction.id);

            throw new Error('Error de concurrencia en el pago. Intenta de nuevo.');
        }

        // 4. Completar transacción
        await supabase
            .from('wallet_transactions')
            .update({ 
                status: 'completed',
                balance_after: newBalance
            })
            .eq('id', transaction.id);

        return {
            success: true,
            newBalance: newBalance,
            transactionId: transaction.id
        };
    },

    /**
     * Obtiene el historial de transacciones del usuario
     * @param {string} userId 
     * @param {number} limit 
     * @param {number} offset 
     * @returns {Promise<Array>}
     */
    async getTransactionHistory(userId, limit = 20, offset = 0) {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error('Error al obtener historial de transacciones');
        }

        return data || [];
    }
};
