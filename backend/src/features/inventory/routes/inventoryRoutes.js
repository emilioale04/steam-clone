import express from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { requireAuth, optionalAuth } from '../../../shared/middleware/authMiddleware.js';
import { limitedAccountValidationMiddleware } from '../../../shared/middleware/limitedAccountValidationMiddleware.js';

const router = express.Router();

// Sincronizar inventario con Steam (requiere estar autenticado)
router.post('/sync', requireAuth, inventoryController.syncInventory);

// Mercado y Ventas (requieren cuenta no limitada para operaciones de escritura)
router.post('/sell', requireAuth, limitedAccountValidationMiddleware, inventoryController.sellItem);
router.post('/sell/cancel', requireAuth, limitedAccountValidationMiddleware, inventoryController.cancelListing);
router.patch('/sell/price', requireAuth, limitedAccountValidationMiddleware, inventoryController.updateListingPrice);
router.post('/market/purchase', requireAuth, limitedAccountValidationMiddleware, inventoryController.purchaseItem);
router.get('/market', optionalAuth, inventoryController.getMarketListings);
router.get('/market/daily-limit', requireAuth, inventoryController.getDailyPurchaseStatus);
router.get('/trades', optionalAuth, inventoryController.getActiveTrades);

// Obtener inventario de un usuario (puede ser público, amigos o privado)
// IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar otras rutas como /market o /trades
router.get('/:userId', optionalAuth, inventoryController.getInventory);

export default router;
