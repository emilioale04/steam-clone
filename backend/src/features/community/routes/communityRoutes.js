import express from 'express';
import { communityController } from '../controllers/communityController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de comunidad requieren autenticación
router.use(requireAuth);

// Anuncios
router.post('/groups/:groupId/announcements', communityController.createAnnouncement);
router.get('/groups/:groupId/announcements', communityController.getGroupAnnouncements);
router.put('/announcements/:announcementId', communityController.updateAnnouncement);
router.delete('/announcements/:announcementId', communityController.deleteAnnouncement);

// Reportes
router.post('/reports', communityController.createReport);
router.get('/groups/:groupId/reports', communityController.getGroupReports);
router.post('/reports/:reportId/resolve', communityController.resolveReport);

export default router;
