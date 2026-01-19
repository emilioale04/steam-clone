/**
 * Controlador de Gestión de Nuevas Aplicaciones - Backend
 * Feature: Creación de Nueva Aplicación (RF-004)
 */

import { developerAuthService } from '../../developer-auth/index.js';
import { newAppService } from '../services/newAppService.js';

export const newAppController = {
  
  /**
   * GET /api/new-app/categorias
   * Obtiene las categorías de contenido activas
   */
  async obtenerCategorias(req, res) {
    try {
      const categorias = await newAppService.obtenerCategorias();

      return res.status(200).json({
        success: true,
        data: categorias
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en obtenerCategorias:', error);
      
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener categorías'
      });
    }
  },

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
        categoria_id: req.body.categoria_id,
      };

      // Validar nombre del juego
      if (!datosApp.nombre_juego || datosApp.nombre_juego.trim().length < 3) {
        return res.status(400).json({
          success: false,
          mensaje: 'El nombre del juego debe tener al menos 3 caracteres'
        });
      }

      // Validar categoría
      if (!datosApp.categoria_id) {
        return res.status(400).json({
          success: false,
          mensaje: 'Debes seleccionar una categoría'
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
   * PUT /api/new-app/:appId/etiquetas
   * Actualiza las etiquetas de una aplicación
   */
  async actualizarEtiquetas(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { etiquetas } = req.body;

      if (!Array.isArray(etiquetas)) {
        return res.status(400).json({
          success: false,
          mensaje: 'Las etiquetas deben ser un array'
        });
      }

      const resultado = await newAppService.actualizarEtiquetas(
        appId,
        desarrolladorId,
        etiquetas
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Etiquetas actualizadas correctamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en actualizarEtiquetas:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('Máximo') || error.message.includes('array')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al actualizar etiquetas'
      });
    }
  },

  /**
   * PUT /api/new-app/:appId/precio
   * Actualiza el precio de una aplicación
   */
  async actualizarPrecio(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { precio_base_usd } = req.body;

      if (precio_base_usd === undefined || precio_base_usd === null) {
        return res.status(400).json({
          success: false,
          mensaje: 'El precio es requerido'
        });
      }

      const resultado = await newAppService.actualizarPrecio(
        appId,
        desarrolladorId,
        precio_base_usd
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Precio actualizado correctamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en actualizarPrecio:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('válido') || error.message.includes('máximo')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al actualizar precio'
      });
    }
  },

  /**
   * PUT /api/new-app/:appId/descripcion
   * Actualiza la descripción larga de una aplicación
   */
  async actualizarDescripcion(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { descripcion_larga } = req.body;

      const resultado = await newAppService.actualizarDescripcionLarga(
        appId,
        desarrolladorId,
        descripcion_larga
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Descripción actualizada correctamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en actualizarDescripcion:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('exceder')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al actualizar descripción'
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
  },

  /**
   * GET /api/new-app/:appId/resenias
   * Obtiene las reseñas de una aplicación
   */
  async obtenerResenias(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      const resenias = await newAppService.obtenerReseniasAplicacion(appId, desarrolladorId);

      return res.status(200).json({
        success: true,
        data: resenias,
        count: resenias.length
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en obtenerResenias:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener reseñas'
      });
    }
  },

  /**
   * POST /api/new-app/:appId/resenias/:resenaId/responder
   * Responder a una reseña
   */
  async responderResenia(req, res) {
    try {
      const { appId, resenaId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { respuesta } = req.body;

      if (!respuesta) {
        return res.status(400).json({
          success: false,
          mensaje: 'La respuesta es requerida'
        });
      }

      const resultado = await newAppService.responderResenia(
        appId,
        desarrolladorId,
        resenaId,
        respuesta
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Respuesta enviada correctamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en responderResenia:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('ya tiene') || error.message.includes('debe tener') ||
          error.message.includes('no puede') || error.message.includes('Solo puedes')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al responder reseña'
      });
    }
  },

  /**
   * GET /api/new-app/:appId/anuncios
   * Obtiene los anuncios de una aplicación
   */
  async obtenerAnuncios(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      const anuncios = await newAppService.obtenerAnunciosAplicacion(appId, desarrolladorId);

      return res.status(200).json({
        success: true,
        data: anuncios,
        count: anuncios.length
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en obtenerAnuncios:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al obtener anuncios'
      });
    }
  },

  /**
   * POST /api/new-app/:appId/anuncios
   * Crear un nuevo anuncio
   */
  async crearAnuncio(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { titulo, contenido, tipo } = req.body;

      if (!titulo || !contenido || !tipo) {
        return res.status(400).json({
          success: false,
          mensaje: 'Título, contenido y tipo son requeridos'
        });
      }

      const resultado = await newAppService.crearAnuncioAplicacion(
        appId,
        desarrolladorId,
        { titulo, contenido, tipo }
      );

      return res.status(201).json({
        success: true,
        mensaje: 'Anuncio publicado correctamente',
        data: resultado
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en crearAnuncio:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      if (error.message.includes('debe tener') || error.message.includes('no puede') ||
          error.message.includes('no válido') || error.message.includes('Solo puedes')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al crear anuncio'
      });
    }
  },

  /**
   * DELETE /api/new-app/:appId/anuncios/:anuncioId
   * Eliminar un anuncio
   */
  async eliminarAnuncio(req, res) {
    try {
      const { appId, anuncioId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      await newAppService.eliminarAnuncioAplicacion(appId, desarrolladorId, anuncioId);

      return res.status(200).json({
        success: true,
        mensaje: 'Anuncio eliminado correctamente'
      });

    } catch (error) {
      console.error('[CONTROLLER] Error en eliminarAnuncio:', error);

      if (error.message.includes('no encontrada') || error.message.includes('sin permisos') ||
          error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al eliminar anuncio'
      });
    }
  }
};
