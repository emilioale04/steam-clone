import express from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { requireAuth, optionalAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Sincronizar inventario con Steam (requiere estar autenticado)
router.post('/sync', requireAuth, inventoryController.syncInventory);

// Mercado y Ventas
router.post('/sell', requireAuth, inventoryController.sellItem);
router.post('/sell/cancel', requireAuth, inventoryController.cancelListing);
router.get('/market', optionalAuth, inventoryController.getMarketListings);
router.get('/trades', optionalAuth, inventoryController.getActiveTrades);

// Obtener inventario de un usuario (puede ser público, amigos o privado)
// IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar otras rutas como /market o /trades
router.get('/:userId', optionalAuth, inventoryController.getInventory);

export default router;
