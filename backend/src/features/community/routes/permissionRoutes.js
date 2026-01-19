import express from 'express';
import { permissionController } from '../controllers/permissionController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de permisos de grupo
 * Todas las rutas requieren autenticación
 */

// GET /api/community/groups/:groupId/permissions - Obtener permisos del grupo
router.get(
    '/groups/:groupId/permissions',
    requireAuth,
    permissionController.getGroupPermissions
);

// PUT /api/community/groups/:groupId/permissions - Actualizar permisos (solo Owner)
router.put(
    '/groups/:groupId/permissions',
    requireAuth,
    permissionController.updateGroupPermissions
);

// POST /api/community/groups/:groupId/permissions/reset - Resetear permisos a valores por defecto
router.post(
    '/groups/:groupId/permissions/reset',
    requireAuth,
    permissionController.resetGroupPermissions
);

export default router;
