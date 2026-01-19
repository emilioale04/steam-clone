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

// Reseñas
router.post('/reviews/:appId', communityController.createReview);
router.get('/reviews/:appId', communityController.getReviews);
router.put('/reviews/:reviewId', communityController.updateReview);
router.delete('/reviews/:reviewId', communityController.deleteReview);

export default router;
