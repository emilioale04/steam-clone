/**
 * Controlador de Mis Aplicaciones - Backend
 * Feature: Mis Aplicaciones (Steamworks Dashboard)
 * 
 * Maneja las peticiones HTTP para la gestión de aplicaciones del desarrollador.
 * Solo operaciones de lectura (GET) - Seguridad first.
 */

import { myAppsService } from '../services/myAppsService.js';

export const myAppsController = {
  /**
   * GET /api/my-apps
   * Obtiene todas las aplicaciones del desarrollador autenticado
   * 
   * Query params:
   * - estado_revision: Filtrar por estado (borrador, en_revision, aprobado, rechazado, publicado)
   * - search: Buscar por nombre del juego
   * 
   * @param {Request} req - Express request (con req.desarrollador del middleware)
   * @param {Response} res - Express response
   */
  async listarAplicaciones(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;
      const { estado_revision, search } = req.query;

      const filters = {};
      if (estado_revision) {
        filters.estado_revision = estado_revision;
      }
      if (search) {
        filters.search = search;
      }

      const result = await myAppsService.obtenerAplicaciones(desarrolladorId, filters);

      if (result.error) {
        return res.status(400).json({
          success: false,
          mensaje: result.error,
          code: 'QUERY_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
        mensaje: `Se encontraron ${result.count} aplicación(es)`
      });

    } catch (error) {
      console.error('[MY_APPS_CONTROLLER] Error en listarAplicaciones:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener aplicaciones',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * GET /api/my-apps/aprobadas
   * Obtiene solo las aplicaciones aprobadas del desarrollador
   * Usado para la vista principal de "Mis Aplicaciones"
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async listarAprobadas(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;

      const result = await myAppsService.obtenerAplicacionesAprobadas(desarrolladorId);

      if (result.error) {
        return res.status(400).json({
          success: false,
          mensaje: result.error,
          code: 'QUERY_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
        mensaje: `Se encontraron ${result.count} aplicación(es) aprobada(s)`
      });

    } catch (error) {
      console.error('[MY_APPS_CONTROLLER] Error en listarAprobadas:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener aplicaciones aprobadas',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * GET /api/my-apps/:appId
   * Obtiene una aplicación específica por su ID
   * 
   * @param {Request} req - Express request con params.appId
   * @param {Response} res - Express response
   */
  async obtenerAplicacion(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;
      const { appId } = req.params;

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(appId)) {
        return res.status(400).json({
          success: false,
          mensaje: 'Formato de ID de aplicación inválido',
          code: 'INVALID_ID'
        });
      }

      const result = await myAppsService.obtenerAplicacionPorId(appId, desarrolladorId);

      if (result.error) {
        return res.status(404).json({
          success: false,
          mensaje: result.error,
          code: 'NOT_FOUND'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('[MY_APPS_CONTROLLER] Error en obtenerAplicacion:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener aplicación',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * GET /api/my-apps/stats
   * Obtiene estadísticas de las aplicaciones del desarrollador
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async obtenerEstadisticas(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;

      const result = await myAppsService.obtenerEstadisticas(desarrolladorId);

      if (result.error) {
        return res.status(400).json({
          success: false,
          mensaje: result.error,
          code: 'QUERY_ERROR'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('[MY_APPS_CONTROLLER] Error en obtenerEstadisticas:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener estadísticas',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};
