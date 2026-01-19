import { walletService } from '../services/walletService.js';
import { limitedAccountService } from '../../../shared/services/limitedAccountService.js';
import { createLogger } from '../../../shared/utils/logger.js';

const logger = createLogger('WalletController');

export const walletController = {
    /**
     * Obtiene el balance actual del usuario
     * GET /api/wallet/balance
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.id;
            const balance = await walletService.getBalance(userId);

            res.json({
                success: true,
                data: {
                    balance: balance
                }
            });
        } catch (error) {
            logger.error('Error al obtener balance:', { error });
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el balance'
            });
        }
    },

    /**
     * Obtiene el estado de cuenta (limitada o no)
     * GET /api/wallet/account-status
     */
    async getAccountStatus(req, res) {
        try {
            const userId = req.user.id;
            const accountStatus = await limitedAccountService.getAccountStatus(userId);

            res.json({
                success: true,
                data: accountStatus
            });
        } catch (error) {
            logger.error('Error al obtener estado de cuenta:', { error });
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el estado de la cuenta'
            });
        }
    },

    /**
     * Recarga la billetera del usuario
     * POST /api/wallet/reload
     * Body: { amount: number, idempotencyKey?: string }
     */
    async reloadWallet(req, res) {
        try {
            const userId = req.user.id;
            const { amount, idempotencyKey } = req.body;

            // Validación básica de entrada
            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto es requerido'
                });
            }

            const parsedAmount = parseFloat(amount);
            
            if (isNaN(parsedAmount)) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número válido'
                });
            }

            const result = await walletService.reloadWallet(userId, parsedAmount, idempotencyKey);

            res.json({
                success: true,
                message: result.accountUnlocked 
                    ? '¡Recarga exitosa! Tu cuenta ha sido desbloqueada.' 
                    : 'Recarga procesada exitosamente',
                data: {
                    newBalance: result.newBalance,
                    transactionId: result.transactionId,
                    accountUnlocked: result.accountUnlocked,
                    unlockMessage: result.unlockMessage
                }
            });
        } catch (error) {
            logger.error('Error en recarga de billetera:', { error });
            
            // Determinar código de estado según el error
            let statusCode = 500;
            if (error.message.includes('mínimo') || 
                error.message.includes('máximo') || 
                error.message.includes('decimales') ||
                error.message.includes('número válido')) {
                statusCode = 400;
            } else if (error.message.includes('límite') || 
                       error.message.includes('excedería')) {
                statusCode = 422;
            } else if (error.message.includes('duplicada') || 
                       error.message.includes('ya fue procesada')) {
                statusCode = 409;
            } else if (error.message.includes('proceso') || 
                       error.message.includes('Espera')) {
                statusCode = 429;
            }

            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al procesar la recarga'
            });
        }
    },

    /**
     * Procesa un pago con la billetera
     * POST /api/wallet/pay
     * Body: { amount: number, description: string, referenceType?: string, referenceId?: string, idempotencyKey: string }
     */
    async processPayment(req, res) {
        try {
            const userId = req.user.id;
            const { amount, description, referenceType, referenceId, idempotencyKey } = req.body;

            // Validaciones de entrada
            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto es requerido'
                });
            }

            if (!idempotencyKey) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un identificador único para el pago (idempotencyKey)'
                });
            }

            if (!description || typeof description !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'La descripción del pago es requerida'
                });
            }

            const parsedAmount = parseFloat(amount);
            
            if (isNaN(parsedAmount)) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número válido'
                });
            }

            const result = await walletService.processPayment(
                userId,
                parsedAmount,
                description.substring(0, 255), // Limitar longitud
                referenceType || null,
                referenceId || null,
                idempotencyKey
            );

            res.json({
                success: true,
                message: 'Pago procesado exitosamente',
                data: {
                    newBalance: result.newBalance,
                    transactionId: result.transactionId
                }
            });
        } catch (error) {
            logger.error('Error en pago:', { error });
            
            let statusCode = 500;
            if (error.message.includes('Fondos insuficientes')) {
                statusCode = 402; // Payment Required
            } else if (error.message.includes('ya fue procesad') || 
                       error.message.includes('duplicada')) {
                statusCode = 409; // Conflict
            } else if (error.message.includes('proceso') || 
                       error.message.includes('múltiples clicks')) {
                statusCode = 429; // Too Many Requests
            } else if (error.message.includes('requerido') || 
                       error.message.includes('válido')) {
                statusCode = 400;
            }

            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al procesar el pago'
            });
        }
    },

    /**
     * Obtiene el historial de transacciones
     * GET /api/wallet/history
     * Query: { limit?: number, offset?: number }
     */
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user.id;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const offset = parseInt(req.query.offset) || 0;

            const transactions = await walletService.getTransactionHistory(userId, limit, offset);

            res.json({
                success: true,
                data: {
                    transactions: transactions,
                    pagination: {
                        limit,
                        offset,
                        hasMore: transactions.length === limit
                    }
                }
            });
        } catch (error) {
            logger.error('Error al obtener historial:', { error });
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el historial de transacciones'
            });
        }
    }
};
