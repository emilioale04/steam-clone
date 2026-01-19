import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/mfa/setup', authController.setupMfa);
router.post('/mfa/verify', authController.verifyMfaLogin);

export default router;