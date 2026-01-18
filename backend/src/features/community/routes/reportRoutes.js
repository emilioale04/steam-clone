import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Crear reporte
router.post('/', reportController.createReport);

// Obtener reportes de un grupo (Owner y Moderator)
router.get('/groups/:groupId', reportController.getGroupReports);

// Resolver reporte (Owner y Moderator)
router.post('/:reportId/resolve', reportController.resolveReport);

export default router;
