/**
 * Rutas de Mis Aplicaciones - Backend
 * Feature: Mis Aplicaciones (Steamworks Dashboard)
 * 
 * Endpoints para gestionar las aplicaciones del desarrollador.
 * Seguridad: Todas las rutas requieren autenticación de desarrollador (C18)
 * 
 * Endpoints disponibles:
 * - GET /api/my-apps - Listar todas las aplicaciones
 * - GET /api/my-apps/aprobadas - Listar solo aplicaciones aprobadas
 * - GET /api/my-apps/stats - Obtener estadísticas
 * - GET /api/my-apps/:appId - Obtener una aplicación específica
 */

import express from 'express';
import { myAppsController } from '../controllers/myAppsController.js';
import { requireDesarrollador } from '../../developer-auth/middleware/developerAuthMiddleware.js';

const router = express.Router();

/**
 * Middleware de autenticación de desarrollador en todas las rutas
 * Valida:
 * - Token JWT válido
 * - Usuario es desarrollador activo
 * - Sesión válida en BD (C15)
 * - MFA verificado si está habilitado
 */
router.use(requireDesarrollador);

/**
 * GET /api/my-apps
 * Obtiene todas las aplicaciones del desarrollador autenticado
 * 
 * Query params opcionales:
 * - estado_revision: borrador | en_revision | aprobado | rechazado | publicado
 * - search: término de búsqueda por nombre
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<Aplicacion>,
 *   count: number,
 *   mensaje: string
 * }
 */
router.get('/', myAppsController.listarAplicaciones);

/**
 * GET /api/my-apps/stats
 * Obtiene estadísticas de las aplicaciones del desarrollador
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     borrador: number,
 *     en_revision: number,
 *     aprobado: number,
 *     rechazado: number,
 *     publicado: number
 *   }
 * }
 */
router.get('/stats', myAppsController.obtenerEstadisticas);

/**
 * GET /api/my-apps/aprobadas
 * Obtiene solo las aplicaciones aprobadas del desarrollador
 * Para la vista principal de "Mis Aplicaciones"
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<Aplicacion>,
 *   count: number,
 *   mensaje: string
 * }
 */
router.get('/aprobadas', myAppsController.listarAprobadas);

/**
 * GET /api/my-apps/:appId
 * Obtiene una aplicación específica por su ID
 * 
 * Params:
 * - appId: UUID de la aplicación
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Aplicacion
 * }
 */
router.get('/:appId', myAppsController.obtenerAplicacion);

export default router;
