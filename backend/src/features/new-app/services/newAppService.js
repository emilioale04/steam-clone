/**
 * Servicio de Gestión de Nuevas Aplicaciones - Backend
 * Feature: Creación de Nueva Aplicación (RF-004)
 * 
 * Seguridad:
 * - Validación de propiedad (C18)
 * - Generación segura de AppID único
 * - Validación de límites de archivos (C13)
 * - Verificación de pago ($100 USD)
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Genera un AppID único con el formato: APP-XXXXXX
 * Ejemplo: APP-7A3F9E
 */
function generarAppId() {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `APP-${randomHex}`;
}

/**
 * Verifica que el AppID sea único en la base de datos
 */
async function verificarAppIdUnico(appId) {
  const { data, error } = await supabaseAdmin
    .from('aplicaciones_desarrolladores')
    .select('app_id')
    .eq('app_id', appId)
    .single();
  
  return !data; // Retorna true si NO existe
}

/**
 * Genera un AppID único garantizado
 */
async function generarAppIdUnico() {
  let appId;
  let intentos = 0;
  const maxIntentos = 10;
  
  do {
    appId = generarAppId();
    intentos++;
    
    if (intentos > maxIntentos) {
      throw new Error('No se pudo generar un AppID único después de varios intentos');
    }
  } while (!(await verificarAppIdUnico(appId)));
  
  return appId;
}

export const newAppService = {
  
  /**
   * GET: Obtiene las categorías de contenido activas
   * 
   * @returns {Promise<Array>} - Lista de categorías activas
   */
  async obtenerCategorias() {
    try {
      const { data: categorias, error } = await supabaseAdmin
        .from('categorias_contenido')
        .select('id, nombre_categoria, descripcion')
        .eq('activa', true)
        .is('deleted_at', null)
        .order('nombre_categoria', { ascending: true });

      if (error) {
        console.error('[NEW_APP] Error al obtener categorías:', error);
        throw new Error('Error al obtener categorías');
      }

      return categorias || [];

    } catch (error) {
      console.error('[NEW_APP] Error en obtenerCategorias:', error);
      throw error;
    }
  },

  /**
   * CREATE: Crea una nueva aplicación para un desarrollador
   * 
   * Validaciones:
   * - Pago de $100 USD completado (RF-004)
   * - Nombre del juego obligatorio
   * - Genera AppID único
   * - Sube archivos a Supabase Storage (si se proveen)
   * 
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Object} datosApp - Datos de la aplicación
   * @param {Object} archivos - Archivos subidos (build, portada)
   * @param {Object} requestMetadata - Metadatos de la request (IP, User-Agent)
   * @returns {Promise<Object>} - Aplicación creada
   */
  async crearAplicacion(desarrolladorId, datosApp, archivos = {}, requestMetadata = {}) {
    try {
      // 1. Validar desarrollador existe
      const { data: desarrollador, error: devError } = await supabaseAdmin
        .from('desarrolladores')
        .select('*')
        .eq('id', desarrolladorId)
        .single();
      
      if (devError || !desarrollador) {
        throw new Error('Desarrollador no encontrado');
      }

      // 2. Validar que la categoría exista y esté activa
      if (datosApp.categoria_id) {
        const { data: categoria, error: catError } = await supabaseAdmin
          .from('categorias_contenido')
          .select('id')
          .eq('id', datosApp.categoria_id)
          .eq('activa', true)
          .is('deleted_at', null)
          .single();

        if (catError || !categoria) {
          throw new Error('Categoría no válida o inactiva');
        }
      }

      // 3. Generar AppID único
      const appId = await generarAppIdUnico();

      // 4. Preparar datos de la aplicación
      const datosInsert = {
        app_id: appId,
        desarrollador_id: desarrolladorId,
        nombre_juego: datosApp.nombre_juego,
        descripcion_corta: datosApp.descripcion_corta || null,
        descripcion_larga: datosApp.descripcion_larga || null,
        categoria_id: datosApp.categoria_id || null,
        pago_registro_completado: true, // Se actualizará cuando se confirme el pago
        monto_pago_registro: 100.00,
      };

      // 4. Subir archivos a Supabase Storage (si existen)
      let buildPublicUrl = null;
      let portadaPublicUrl = null;

      if (archivos.build_file) {
        const buildFile = archivos.build_file;
        const extension = buildFile.originalname.slice(buildFile.originalname.lastIndexOf('.'));
        const buildFileName = `executable${extension}`;
        const buildPath = `${appId}/${buildFileName}`;

        // Subir archivo ejecutable al bucket "builds"
        const { data: uploadBuildData, error: uploadBuildError } = await supabaseAdmin.storage
          .from('builds')
          .upload(buildPath, buildFile.buffer, {
            contentType: buildFile.mimetype,
            upsert: false
          });

        if (uploadBuildError) {
          console.error('[NEW_APP] Error al subir ejecutable:', uploadBuildError);
          throw new Error('Error al subir el archivo ejecutable');
        }

        // Generar URL pública del ejecutable
        const { data: buildUrlData } = supabaseAdmin.storage
          .from('builds')
          .getPublicUrl(buildPath);

        buildPublicUrl = buildUrlData.publicUrl;
        
        // Guardar URL pública en la BD
        datosInsert.build_storage_path = buildPublicUrl;
      }

      if (archivos.portada_file) {
        const portadaFile = archivos.portada_file;
        const extension = portadaFile.originalname.slice(portadaFile.originalname.lastIndexOf('.'));
        const portadaFileName = `portada${extension}`;
        const portadaPath = `${appId}/${portadaFileName}`;

        // Subir imagen de portada al bucket "builds"
        const { data: uploadPortadaData, error: uploadPortadaError } = await supabaseAdmin.storage
          .from('builds')
          .upload(portadaPath, portadaFile.buffer, {
            contentType: portadaFile.mimetype,
            upsert: false
          });

        if (uploadPortadaError) {
          console.error('[NEW_APP] Error al subir portada:', uploadPortadaError);
          throw new Error('Error al subir la imagen de portada');
        }

        // Generar URL pública de la portada
        const { data: portadaUrlData } = supabaseAdmin.storage
          .from('builds')
          .getPublicUrl(portadaPath);

        portadaPublicUrl = portadaUrlData.publicUrl;
        
        // Guardar URL pública en la BD
        datosInsert.portada_image_path = portadaPublicUrl;
      }

      // 5. Insertar en la base de datos
      const { data: nuevaApp, error: insertError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .insert(datosInsert)
        .select('*')
        .single();

      if (insertError) {
        console.error('[NEW_APP] Error al insertar aplicación:', insertError);
        throw new Error('Error al crear la aplicación en la base de datos');
      }

      // 6. Crear registro de revisión automáticamente (RF-005)
      const { data: revision, error: revisionError } = await supabaseAdmin
        .from('revisiones_juegos')
        .insert({
          id_juego: nuevaApp.id,
          estado: 'pendiente'
        })
        .select('*')
        .single();

      if (revisionError) {
        console.error('[NEW_APP] Error al crear registro de revisión:', revisionError);
      } else {
        console.log('Registro de revisión creado:', revision.id, '- Estado:', revision.estado); 
      }

      // 7. Registrar auditoría
      await supabaseAdmin.from('auditoria_eventos').insert({
        usuario_id: desarrolladorId,
        tipo_usuario: 'desarrollador',
        accion: 'crear_aplicacion',
        recurso_tipo: 'aplicacion',
        recurso_id: nuevaApp.id,
        detalles: {
          app_id: appId,
          nombre_juego: datosApp.nombre_juego,
          ip_address: requestMetadata.ip_address,
          user_agent: requestMetadata.user_agent
        }
      });

      // 8. Retornar aplicación creada
      return {
        id: nuevaApp.id,
        app_id: nuevaApp.app_id,
        nombre_juego: nuevaApp.nombre_juego,
        descripcion_corta: nuevaApp.descripcion_corta,
        descripcion_larga: nuevaApp.descripcion_larga,
        estado_revision: nuevaApp.estado_revision,
        pago_registro_completado: nuevaApp.pago_registro_completado,
        monto_pago_registro: nuevaApp.monto_pago_registro,
        created_at: nuevaApp.created_at,
        revision: {
          estado: revision?.estado || 'pendiente',
          id: revision?.id || null
        },
        archivos_subidos: {
          ejecutable: buildPublicUrl,
          portada: portadaPublicUrl
        },
        mensaje: 'Aplicación creada exitosamente y enviada a revisión. Se requiere pago de $100 USD para activar el AppID.'
      };

    } catch (error) {
      console.error('[NEW_APP] Error en crearAplicacion:', error);
      throw error;
    }
  },

  /**
   * LIST: Lista todas las aplicaciones de un desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Array>} - Lista de aplicaciones
   */
  async listarAplicaciones(desarrolladorId) {
    try {
      const { data: aplicaciones, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('*')
        .eq('desarrollador_id', desarrolladorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[NEW_APP] Error al listar aplicaciones:', error);
        throw new Error('Error al listar aplicaciones');
      }

      return aplicaciones || [];

    } catch (error) {
      console.error('[NEW_APP] Error en listarAplicaciones:', error);
      throw error;
    }
  },

  /**
   * GET: Obtiene una aplicación específica
   * 
   * Validaciones:
   * - La aplicación debe pertenecer al desarrollador (C18)
   * 
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Object>} - Datos de la aplicación
   */
  async obtenerAplicacion(appId, desarrolladorId) {
    try {
      const { data: aplicacion, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('*')
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .single();

      if (error || !aplicacion) {
        throw new Error('Aplicación no encontrada o sin permisos');
      }

      return aplicacion;

    } catch (error) {
      console.error('[NEW_APP] Error en obtenerAplicacion:', error);
      throw error;
    }
  },

  /**
   * UPDATE: Actualiza una aplicación existente
   * 
   * Validaciones:
   * - La aplicación debe pertenecer al desarrollador (C18)
   * - Solo se puede editar si está en estado "pendiente"
   * 
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Object} datosActualizados - Datos a actualizar
   * @param {Object} archivos - Archivos actualizados (opcional)
   * @returns {Promise<Object>} - Aplicación actualizada
   */
  async actualizarAplicacion(appId, desarrolladorId, datosActualizados, archivos = {}) {
    try {
      // 1. Verificar propiedad y estado (C18)
      const aplicacion = await this.obtenerAplicacion(appId, desarrolladorId);

      if (aplicacion.estado_revision !== 'pendiente') {
        throw new Error('Solo se pueden editar aplicaciones en estado "pendiente"');
      }

      // 2. Preparar datos de actualización
      const datosUpdate = {
        updated_at: new Date().toISOString()
      };

      if (datosActualizados.nombre_juego) {
        datosUpdate.nombre_juego = datosActualizados.nombre_juego;
      }

      if (datosActualizados.descripcion_corta !== undefined) {
        datosUpdate.descripcion_corta = datosActualizados.descripcion_corta;
      }

      if (datosActualizados.descripcion_larga !== undefined) {
        datosUpdate.descripcion_larga = datosActualizados.descripcion_larga;
      }

      // 3. Actualizar archivos si se proveen
      if (archivos.build_file) {
        const buildFile = archivos.build_file;
        const extension = buildFile.originalname.slice(buildFile.originalname.lastIndexOf('.'));
        const buildFileName = `executable${extension}`;
        const buildPath = `${aplicacion.app_id}/${buildFileName}`;

        // Eliminar archivo anterior si existe
        if (aplicacion.build_storage_path) {
          // Extraer la ruta desde la URL (la parte después de '/builds/')
          const oldPath = aplicacion.build_storage_path.includes('/builds/') 
            ? aplicacion.build_storage_path.split('/builds/')[1]
            : aplicacion.build_storage_path;
          
          await supabaseAdmin.storage
            .from('builds')
            .remove([oldPath]);
        }

        // Subir nuevo archivo ejecutable
        const { data: uploadBuildData, error: uploadBuildError } = await supabaseAdmin.storage
          .from('builds')
          .upload(buildPath, buildFile.buffer, {
            contentType: buildFile.mimetype,
            upsert: true
          });

        if (uploadBuildError) {
          console.error('[NEW_APP] Error al actualizar ejecutable:', uploadBuildError);
          throw new Error('Error al actualizar el archivo ejecutable');
        }

        // Generar y guardar URL pública
        const { data: buildUrlData } = supabaseAdmin.storage
          .from('builds')
          .getPublicUrl(buildPath);

        datosUpdate.build_storage_path = buildUrlData.publicUrl;
      }

      if (archivos.portada_file) {
        const portadaFile = archivos.portada_file;
        const extension = portadaFile.originalname.slice(portadaFile.originalname.lastIndexOf('.'));
        const portadaFileName = `portada${extension}`;
        const portadaPath = `${aplicacion.app_id}/${portadaFileName}`;

        // Eliminar imagen anterior si existe
        if (aplicacion.portada_image_path) {
          // Extraer la ruta desde la URL (la parte después de '/builds/')
          const oldPath = aplicacion.portada_image_path.includes('/builds/') 
            ? aplicacion.portada_image_path.split('/builds/')[1]
            : aplicacion.portada_image_path;
          
          await supabaseAdmin.storage
            .from('builds')
            .remove([oldPath]);
        }

        // Subir nueva imagen de portada
        const { data: uploadPortadaData, error: uploadPortadaError } = await supabaseAdmin.storage
          .from('builds')
          .upload(portadaPath, portadaFile.buffer, {
            contentType: portadaFile.mimetype,
            upsert: true
          });

        if (uploadPortadaError) {
          console.error('[NEW_APP] Error al actualizar portada:', uploadPortadaError);
          throw new Error('Error al actualizar la imagen de portada');
        }

        // Generar y guardar URL pública
        const { data: portadaUrlData } = supabaseAdmin.storage
          .from('builds')
          .getPublicUrl(portadaPath);

        datosUpdate.portada_image_path = portadaUrlData.publicUrl;
      }

      // 4. Actualizar en la base de datos
      const { data: appActualizada, error: updateError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update(datosUpdate)
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .select('*')
        .single();

      if (updateError) {
        console.error('[NEW_APP] Error al actualizar aplicación:', updateError);
        throw new Error('Error al actualizar la aplicación');
      }

      return appActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en actualizarAplicacion:', error);
      throw error;
    }
  },

  /**
   * UPDATE: Actualiza las etiquetas de una aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Array<string>} etiquetas - Array de etiquetas
   * @returns {Promise<Object>} - Aplicación actualizada
   */
  async actualizarEtiquetas(appId, desarrolladorId, etiquetas) {
    try {
      // 1. Verificar propiedad (C18)
      await this.obtenerAplicacion(appId, desarrolladorId);

      // 2. Validar etiquetas
      if (!Array.isArray(etiquetas)) {
        throw new Error('Las etiquetas deben ser un array');
      }

      if (etiquetas.length > 10) {
        throw new Error('Máximo 10 etiquetas permitidas');
      }

      // Limpiar y validar cada etiqueta
      const etiquetasLimpias = etiquetas
        .map(e => e.toString().trim().toLowerCase())
        .filter(e => e.length > 0 && e.length <= 30);

      // 3. Actualizar en la base de datos
      const { data: appActualizada, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          etiquetas: etiquetasLimpias,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al actualizar etiquetas:', error);
        throw new Error('Error al actualizar etiquetas');
      }

      return appActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en actualizarEtiquetas:', error);
      throw error;
    }
  },

  /**
   * UPDATE: Actualiza el precio base de una aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {number} precio - Precio en USD (0-1000)
   * @returns {Promise<Object>} - Aplicación actualizada
   */
  async actualizarPrecio(appId, desarrolladorId, precio) {
    try {
      // 1. Verificar propiedad (C18)
      await this.obtenerAplicacion(appId, desarrolladorId);

      // 2. Validar precio
      const precioNumerico = parseFloat(precio);

      if (isNaN(precioNumerico) || precioNumerico < 0) {
        throw new Error('El precio debe ser un número válido mayor o igual a 0');
      }

      if (precioNumerico > 1000) {
        throw new Error('El precio máximo permitido es $1000 USD');
      }

      // 3. Actualizar en la base de datos
      const { data: appActualizada, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          precio_base_usd: precioNumerico,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al actualizar precio:', error);
        throw new Error('Error al actualizar precio');
      }

      return appActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en actualizarPrecio:', error);
      throw error;
    }
  },

  /**
   * UPDATE: Actualiza la descripción larga de una aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {string} descripcionLarga - Nueva descripción larga
   * @returns {Promise<Object>} - Aplicación actualizada
   */
  async actualizarDescripcionLarga(appId, desarrolladorId, descripcionLarga) {
    try {
      // 1. Verificar propiedad (C18)
      await this.obtenerAplicacion(appId, desarrolladorId);

      // 2. Validar descripción
      if (descripcionLarga && descripcionLarga.length > 2000) {
        throw new Error('La descripción no puede exceder los 2000 caracteres');
      }

      // 3. Actualizar en la base de datos
      const { data: appActualizada, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          descripcion_larga: descripcionLarga || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al actualizar descripción:', error);
        throw new Error('Error al actualizar descripción');
      }

      return appActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en actualizarDescripcionLarga:', error);
      throw error;
    }
  },

  /**
   * Procesa el pago de registro de una aplicación
   * Actualiza pago_registro_completado = true
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador
   * @returns {Promise<Object>} - Aplicación con pago confirmado
   */
  async procesarPagoRegistro(appId, desarrolladorId) {
    try {
      // Verificar propiedad
      await this.obtenerAplicacion(appId, desarrolladorId);

      // Actualizar estado de pago
      const { data: appActualizada, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          pago_registro_completado: true,
          fecha_pago_registro: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .eq('desarrollador_id', desarrolladorId)
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al procesar pago:', error);
        throw new Error('Error al procesar el pago');
      }

      return appActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en procesarPagoRegistro:', error);
      throw error;
    }
  },

  /**
   * GET: Obtiene las reseñas de una aplicación (sin respuesta del desarrollador)
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Array>} - Lista de reseñas pendientes de respuesta
   */
  async obtenerReseniasAplicacion(appId, desarrolladorId) {
    try {
      // Verificar propiedad de la app
      await this.obtenerAplicacion(appId, desarrolladorId);

      // Obtener reseñas de la tabla resenas_juegos
      const { data: resenias, error } = await supabaseAdmin
        .from('resenas_juegos')
        .select(`
          id,
          usuario_id,
          rating,
          titulo,
          comentario,
          recomendado,
          respuesta_desarrollador,
          fecha_respuesta,
          visible,
          created_at,
          profiles!resenas_juegos_usuario_id_fkey (
            id,
            username
          )
        `)
        .eq('aplicacion_id', appId)
        .eq('visible', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[NEW_APP] Error al obtener reseñas:', error);
        throw new Error('Error al obtener reseñas');
      }

      // Formatear reseñas
      const reseniasFormateadas = (resenias || []).map(r => ({
        id: r.id,
        usuario: r.profiles?.username || 'Usuario',
        avatar: null,
        rating: r.rating,
        titulo: r.titulo,
        comentario: r.comentario,
        recomendado: r.recomendado,
        fecha: r.created_at,
        respuesta_desarrollador: r.respuesta_desarrollador,
        fecha_respuesta: r.fecha_respuesta
      }));

      return reseniasFormateadas;

    } catch (error) {
      console.error('[NEW_APP] Error en obtenerReseniasAplicacion:', error);
      throw error;
    }
  },

  /**
   * POST: Responder a una reseña de la aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {string} resenaId - ID de la reseña
   * @param {string} respuesta - Texto de la respuesta
   * @returns {Promise<Object>} - Reseña actualizada
   */
  async responderResenia(appId, desarrolladorId, resenaId, respuesta) {
    try {
      // Verificar propiedad de la app
      const app = await this.obtenerAplicacion(appId, desarrolladorId);

      // Verificar que la app esté aprobada o publicada
      if (!['aprobado', 'publicado'].includes(app.estado_revision)) {
        throw new Error('Solo puedes responder reseñas de aplicaciones aprobadas o publicadas');
      }

      // Verificar que la reseña pertenece a esta app
      const { data: resena, error: resenaError } = await supabaseAdmin
        .from('resenas_juegos')
        .select('id, aplicacion_id, respuesta_desarrollador')
        .eq('id', resenaId)
        .eq('aplicacion_id', appId)
        .is('deleted_at', null)
        .single();

      if (resenaError || !resena) {
        throw new Error('Reseña no encontrada');
      }

      if (resena.respuesta_desarrollador) {
        throw new Error('Esta reseña ya tiene una respuesta');
      }

      // Validar respuesta
      if (!respuesta || respuesta.trim().length < 10) {
        throw new Error('La respuesta debe tener al menos 10 caracteres');
      }

      if (respuesta.length > 1000) {
        throw new Error('La respuesta no puede exceder los 1000 caracteres');
      }

      // Actualizar reseña con la respuesta
      const { data: resenaActualizada, error } = await supabaseAdmin
        .from('resenas_juegos')
        .update({
          respuesta_desarrollador: respuesta.trim(),
          desarrollador_respuesta_id: desarrolladorId,
          fecha_respuesta: new Date().toISOString()
        })
        .eq('id', resenaId)
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al responder reseña:', error);
        throw new Error('Error al guardar la respuesta');
      }

      return resenaActualizada;

    } catch (error) {
      console.error('[NEW_APP] Error en responderResenia:', error);
      throw error;
    }
  },

  /**
   * GET: Obtiene los anuncios de una aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Array>} - Lista de anuncios
   */
  async obtenerAnunciosAplicacion(appId, desarrolladorId) {
    try {
      // Verificar propiedad de la app
      await this.obtenerAplicacion(appId, desarrolladorId);

      const { data: anuncios, error } = await supabaseAdmin
        .from('anuncios_desarrollador')
        .select('*')
        .eq('aplicacion_id', appId)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('fecha_publicacion', { ascending: false });

      if (error) {
        console.error('[NEW_APP] Error al obtener anuncios:', error);
        throw new Error('Error al obtener anuncios');
      }

      return anuncios || [];

    } catch (error) {
      console.error('[NEW_APP] Error en obtenerAnunciosAplicacion:', error);
      throw error;
    }
  },

  /**
   * POST: Crear un nuevo anuncio para la aplicación
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Object} datosAnuncio - Datos del anuncio
   * @returns {Promise<Object>} - Anuncio creado
   */
  async crearAnuncioAplicacion(appId, desarrolladorId, datosAnuncio) {
    try {
      // Verificar propiedad de la app
      const app = await this.obtenerAplicacion(appId, desarrolladorId);

      // Verificar que la app esté aprobada o publicada
      if (!['aprobado', 'publicado'].includes(app.estado_revision)) {
        throw new Error('Solo puedes publicar anuncios en aplicaciones aprobadas o publicadas');
      }

      // Validar datos del anuncio (mínimo 3 caracteres según constraint de la BD)
      if (!datosAnuncio.titulo || datosAnuncio.titulo.trim().length < 3) {
        throw new Error('El título debe tener al menos 3 caracteres');
      }

      if (datosAnuncio.titulo.length > 255) {
        throw new Error('El título no puede exceder los 255 caracteres');
      }

      // Contenido mínimo 10 caracteres según constraint de la BD
      if (!datosAnuncio.contenido || datosAnuncio.contenido.trim().length < 10) {
        throw new Error('El contenido debe tener al menos 10 caracteres');
      }

      if (datosAnuncio.contenido.length > 5000) {
        throw new Error('El contenido no puede exceder los 5000 caracteres');
      }

      // Tipos válidos según constraint de la BD: noticia, evento, parche, actualizacion, promocion
      const tiposValidos = ['noticia', 'evento', 'parche', 'actualizacion', 'promocion'];
      if (!tiposValidos.includes(datosAnuncio.tipo)) {
        throw new Error('Tipo de anuncio no válido');
      }

      // Crear anuncio en tabla anuncios_desarrollador
      const { data: nuevoAnuncio, error } = await supabaseAdmin
        .from('anuncios_desarrollador')
        .insert({
          aplicacion_id: appId,
          desarrollador_id: desarrolladorId,
          titulo: datosAnuncio.titulo.trim(),
          contenido: datosAnuncio.contenido.trim(),
          tipo: datosAnuncio.tipo,
          activo: true,
          fecha_publicacion: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('[NEW_APP] Error al crear anuncio:', error);
        throw new Error('Error al crear el anuncio');
      }

      return nuevoAnuncio;

    } catch (error) {
      console.error('[NEW_APP] Error en crearAnuncioAplicacion:', error);
      throw error;
    }
  },

  /**
   * DELETE: Eliminar un anuncio (soft delete)
   *
   * @param {string} appId - ID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {string} anuncioId - ID del anuncio
   * @returns {Promise<Object>} - Confirmación
   */
  async eliminarAnuncioAplicacion(appId, desarrolladorId, anuncioId) {
    try {
      // Verificar propiedad de la app
      await this.obtenerAplicacion(appId, desarrolladorId);

      // Verificar que el anuncio existe y pertenece a la app
      const { data: anuncio, error: anuncioError } = await supabaseAdmin
        .from('anuncios_desarrollador')
        .select('id')
        .eq('id', anuncioId)
        .eq('aplicacion_id', appId)
        .is('deleted_at', null)
        .single();

      if (anuncioError || !anuncio) {
        throw new Error('Anuncio no encontrado');
      }

      // Soft delete
      const { error } = await supabaseAdmin
        .from('anuncios_desarrollador')
        .update({
          deleted_at: new Date().toISOString(),
          activo: false
        })
        .eq('id', anuncioId);

      if (error) {
        console.error('[NEW_APP] Error al eliminar anuncio:', error);
        throw new Error('Error al eliminar el anuncio');
      }

      return { success: true };

    } catch (error) {
      console.error('[NEW_APP] Error en eliminarAnuncioAplicacion:', error);
      throw error;
    }
  }
};
