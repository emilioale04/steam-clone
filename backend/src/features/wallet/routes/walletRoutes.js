import express from 'express';
import { walletController } from '../controllers/walletController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

/**
 * Wallet Routes
 * Todas las rutas requieren autenticación
 */

// GET /api/wallet/balance - Obtener balance actual
router.get('/balance', requireAuth, walletController.getBalance);

// POST /api/wallet/reload - Recargar billetera
router.post('/reload', requireAuth, walletController.reloadWallet);

// POST /api/wallet/pay - Procesar pago
router.post('/pay', requireAuth, walletController.processPayment);

// GET /api/wallet/history - Obtener historial de transacciones
router.get('/history', requireAuth, walletController.getTransactionHistory);

export default router;
