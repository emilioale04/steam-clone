import express from 'express';
import { consentController } from '../controllers/consentController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Obtener estado de consentimiento
router.get('/', consentController.getConsent);

// Verificar si tiene consentimiento activo
router.get('/check', consentController.checkConsent);

// Otorgar consentimiento
router.post('/grant', consentController.grantConsent);

// Revocar consentimiento
router.post('/revoke', consentController.revokeConsent);

export default router;
