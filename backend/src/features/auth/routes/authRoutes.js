import { Router } from 'express';
// Traemos TU corrección (import * as) para que no rompa el servidor
import * as authController from '../controllers/authController.js';
// Mantenemos el middleware de tus compañeros (GeoIP)
import geoValidationMiddleware from '../../../shared/middleware/geoValidationMiddleware.js';

const router = Router();

router.post('/register', authController.register);
// En login, mantenemos el middleware de ellos PERO usamos tu controlador
router.post('/login', geoValidationMiddleware, authController.login);
router.post('/logout', authController.logout);
router.post('/mfa/setup', authController.setupMfa);
router.post('/mfa/verify', authController.verifyMfaLogin);

export default router;