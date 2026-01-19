/**
 * Rutas de Gestión de Perfil de Desarrolladores
 * Prefijo: /api/desarrolladores/perfil
 *
 * Implementa RF-003: Actualización de información personal y bancaria
 */

import express from 'express';
import { developerProfileController } from '../controllers/developerProfileController.js';
import { requireDesarrollador } from '../middleware/developerAuthMiddleware.js';
import { authLimiter } from '../../../shared/middleware/rateLimiter.js';

const router = express.Router();

// Todas las rutas requieren autenticación de desarrollador
router.use(requireDesarrollador);

// Obtener perfil completo (información personal y bancaria)
router.get('/completo', developerProfileController.obtenerPerfilCompleto);

// Actualizar información personal (RF-003)
// Requiere MFA y valida restricción de 5 días
router.put(
  '/informacion-personal',
  authLimiter,
  developerProfileController.actualizarInformacionPersonal,
);

// Actualizar información bancaria (RF-003)
// Requiere MFA, cifrado AES-256 y valida restricción de 5 días
router.put(
  '/informacion-bancaria',
  authLimiter,
  developerProfileController.actualizarInformacionBancaria,
);

// === MFA Management ===
// Obtener estado de MFA
router.get('/mfa/status', developerProfileController.obtenerEstadoMFA);

// Iniciar setup de MFA (generar QR)
router.post('/mfa/setup', authLimiter, developerProfileController.setupMFA);

// Verificar y activar MFA
router.post(
  '/mfa/verify',
  authLimiter,
  developerProfileController.verificarYActivarMFA,
);

// Deshabilitar MFA
router.delete(
  '/mfa/disable',
  authLimiter,
  developerProfileController.deshabilitarMFA,
);

export default router;
