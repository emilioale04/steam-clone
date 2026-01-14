import express from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { requireAuth, optionalAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Obtener inventario de un usuario (puede ser público, amigos o privado)
// Usamos optionalAuth para saber quién es el visor, pero la ruta es accesible
router.get('/:userId', optionalAuth, inventoryController.getInventory);

// Sincronizar inventario con Steam (requiere estar autenticado)
router.post('/sync', requireAuth, inventoryController.syncInventory);

export default router;
