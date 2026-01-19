import express from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Obtener notificaciones del usuario
router.get('/', notificationController.getNotifications);

// Marcar notificación como leída
router.put('/:notificationId/read', notificationController.markAsRead);

// Marcar todas como leídas
router.put('/read-all', notificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
