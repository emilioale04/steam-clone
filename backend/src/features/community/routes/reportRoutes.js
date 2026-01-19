import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Obtener reportes del grupo
router.get('/:groupId/reports', reportController.getGroupReports);

// Aprobar reporte
router.post('/:groupId/reports/:reportId/approve', reportController.approveReport);

// Rechazar reporte
router.post('/:groupId/reports/:reportId/reject', reportController.rejectReport);

export default router;
