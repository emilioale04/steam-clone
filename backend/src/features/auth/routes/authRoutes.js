import express from 'express';
import { authController } from '../controllers/authController.js';
import geoValidationMiddleware from '../../../shared/middleware/geoValidationMiddleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', geoValidationMiddleware, authController.login);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerification);
router.get('/user', authController.getUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
