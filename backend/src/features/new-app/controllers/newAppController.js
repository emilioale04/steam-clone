/**
 * Controlador de Gestión de Nuevas Aplicaciones - Backend
 * Feature: Creación de Nueva Aplicación (RF-004)
 */

import { developerAuthService } from '../../developer-auth/index.js';
import { newAppService } from '../services/newAppService.js';

export const newAppController = {
  
  /**
   * POST /api/new-app
   * Crea una nueva aplicación
   */
  async crearAplicacion(req, res) {
    try {
      const desarrolladorId = (await developerAuthService.obtenerDesarrolladorActual()).desarrollador.id;

      // Obtener datos del body
      const datosApp = {
        nombre_juego: req.body.nombre_juego,
        descripcion_corta: req.body.descripcion_corta,
        descripcion_larga: req.body.descripcion_larga,
      };

      // Validar nombre del juego
      if (!datosApp.nombre_juego || datosApp.nombre_juego.trim().length < 3) {
        return res.status(400).json({
          success: false,
          mensaje: 'El nombre del juego debe tener al menos 3 caracteres'
        });
      }

      // Obtener archivos subidos (si existen)
      const archivos = {
        build_file: req.files?.build_file?.[0] || null,
        portada_file: req.files?.portada_file?.[0] || null,
      };

      // Metadata de la request para auditoría
      const requestMetadata = {
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('user-agent')
      };

      // Crear aplicación
      const resultado = await newAppService.crearAplicacion(
        desarrolladorId,
        datosApp,
        archivos,
        requestMetadata
      );

      return res.status(201).json({
        success: true,
        mensaje: 'Aplicación creada exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en crearAplicacion:', error);
      
      // Errores conocidos
      if (error.message.includes('Desarrollador no encontrado')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      // Error genérico
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al crear la aplicación'
      });
    }
  },

  /**
   * GET /api/new-app
   * Lista todas las aplicaciones del desarrollador autenticado
   */
  async listarAplicaciones(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;

      const aplicaciones = await newAppService.listarAplicaciones(desarrolladorId);

      return res.status(200).json({
        success: true,
        data: aplicaciones,
        count: aplicaciones.length
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en listarAplicaciones:', error);
      
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al listar aplicaciones'
      });
    }
  },

  /**
   * GET /api/new-app/:appId
   * Obtiene una aplicación específica
   */
  async obtenerAplicacion(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      const aplicacion = await newAppService.obtenerAplicacion(appId, desarrolladorId);

      return res.status(200).json({
        success: true,
        data: aplicacion
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en obtenerAplicacion:', error);
      
      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener la aplicación'
      });
    }
  },

  /**
   * PUT /api/new-app/:appId
   * Actualiza una aplicación existente
   */
  async actualizarAplicacion(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      
      // Obtener datos del body
      const datosActualizados = {
        nombre_juego: req.body.nombre_juego,
        descripcion_corta: req.body.descripcion_corta,
        descripcion_larga: req.body.descripcion_larga,
      };

      // Obtener archivos subidos (si existen)
      const archivos = {
        build_file: req.files?.build_file?.[0] || null,
        portada_file: req.files?.portada_file?.[0] || null,
      };

      const resultado = await newAppService.actualizarAplicacion(
        appId,
        desarrolladorId,
        datosActualizados,
        archivos
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Aplicación actualizada exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en actualizarAplicacion:', error);
      
      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('Solo se pueden editar')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al actualizar la aplicación'
      });
    }
  },

  /**
   * POST /api/new-app/:appId/pagar
   * Procesa el pago de registro de una aplicación
   */
  async procesarPago(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      // TODO: Integrar con pasarela de pagos real
      // Por ahora, simplemente marcamos el pago como completado
      
      const resultado = await newAppService.procesarPagoRegistro(appId, desarrolladorId);

      return res.status(200).json({
        success: true,
        mensaje: 'Pago procesado exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en procesarPago:', error);
      
      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al procesar el pago'
      });
    }
  }
};
