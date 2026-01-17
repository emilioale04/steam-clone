/**
 * Rutas de Autenticación para Desarrolladores (Steamworks)
 * Prefijo: /api/desarrolladores/auth
 * 
 * Grupo 2 - Con seguridad mejorada
 */

import express from 'express';
import { developerAuthController } from '../controllers/developerAuthController.js';
import { aplicacionesController } from '../controllers/aplicacionesController.js';
import { loginLimiter, registerLimiter, authLimiter } from '../../../shared/middleware/rateLimiter.js';
import { requireDesarrollador } from '../middleware/developerAuthMiddleware.js';

const router = express.Router();

// Registro de nuevo desarrollador (RF-001) con rate limiting
router.post('/registro', registerLimiter, developerAuthController.registro);

// Inicio de sesión (RF-002) con rate limiting estricto
router.post('/login', loginLimiter, developerAuthController.login);

// Cierre de sesión
router.post('/logout', developerAuthController.logout);

// Obtener perfil del desarrollador autenticado
router.get('/perfil', developerAuthController.obtenerPerfil);

// Verificar si es desarrollador válido
router.get('/verificar', developerAuthController.verificarDesarrollador);

// Recuperación de contraseña con rate limiting
router.post('/forgot-password', authLimiter, developerAuthController.forgotPassword);
router.post('/reset-password', authLimiter, developerAuthController.resetPassword);

// Obtener aplicaciones del desarrollador (requiere autenticación)
router.get('/aplicaciones', requireDesarrollador, aplicacionesController.obtenerAplicaciones);

export default router;
