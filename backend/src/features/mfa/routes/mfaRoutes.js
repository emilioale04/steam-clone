import express from 'express';
import mfaController from '../controllers/mfaController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import adminMiddleware from '../../admin/middleware/adminMiddleware.js';
import mfaMiddleware from '../middleware/mfaMiddleware.js';

const router = express.Router();

/**
 * Rutas protegidas - requieren autenticación de administrador
 * Se mantiene compatibilidad con admin usando mfaMiddleware.setUserType('admin')
 */

// Iniciar configuración de MFA
router.post('/setup', requireAuth, adminMiddleware.verificarAdmin, mfaMiddleware.setUserType('admin'), mfaController.setupMFA);

// Verificar código y activar MFA
router.post('/verify-enable', requireAuth, adminMiddleware.verificarAdmin, mfaMiddleware.setUserType('admin'), mfaController.verifyAndEnable);

// Deshabilitar MFA
router.post('/disable', requireAuth, adminMiddleware.verificarAdmin, mfaMiddleware.setUserType('admin'), mfaController.disable);

// Obtener estado de MFA
router.get('/status', requireAuth, adminMiddleware.verificarAdmin, mfaMiddleware.setUserType('admin'), mfaController.getStatus);

// Regenerar códigos de respaldo
router.post('/regenerate-backup-codes', requireAuth, adminMiddleware.verificarAdmin, mfaMiddleware.setUserType('admin'), mfaController.regenerateBackupCodes);

/**
 * Rutas públicas (para login y configuración inicial)
 * Estas rutas aceptan userType como parámetro para ser genéricas
 */

// Iniciar configuración de MFA durante login (primera vez)
router.post('/setup-initial', mfaMiddleware.extractUserType, mfaController.setupInitial);

// Verificar código y activar MFA durante login (primera vez) y completar login
router.post('/verify-enable-initial', mfaMiddleware.extractUserType, mfaController.verifyAndEnableInitial);

// Verificar código durante login (no requiere autenticación previa)
router.post('/verify-login', mfaMiddleware.extractUserType, mfaController.verifyLogin);

// Verificar código MFA para operaciones administrativas sensibles (requiere autenticación)
router.post('/verify', requireAuth, mfaMiddleware.extractUserType, mfaController.verifyOperationCode);

export default router;
