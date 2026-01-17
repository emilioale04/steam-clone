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

export default router;
