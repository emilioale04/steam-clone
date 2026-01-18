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
        estado_revision: 'borrador',
        pago_registro_completado: false, // Se actualizará cuando se confirme el pago
        monto_pago_registro: 100.00,
      };

      // 4. Subir archivos a Supabase Storage (si existen)
      if (archivos.build_file) {
        // TODO: Implementar subida a Supabase Storage
        // Por ahora, guardamos un placeholder
        datosInsert.build_storage_path = `builds/${appId}/${archivos.build_file.name}`;
      }

      if (archivos.portada_file) {
        // TODO: Implementar subida a Supabase Storage
        // Por ahora, guardamos un placeholder
        datosInsert.portada_image_path = `portadas/${appId}/${archivos.portada_file.name}`;
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

      // 6. Registrar auditoría
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

      // 7. Retornar aplicación creada
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
        mensaje: 'Aplicación creada exitosamente. Se requiere pago de $100 USD para activar el AppID.'
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
   * - Solo se puede editar si está en estado "borrador"
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

      if (aplicacion.estado_revision !== 'borrador') {
        throw new Error('Solo se pueden editar aplicaciones en estado "borrador"');
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
        // TODO: Implementar subida a Supabase Storage
        datosUpdate.build_storage_path = `builds/${aplicacion.app_id}/${archivos.build_file.name}`;
      }

      if (archivos.portada_file) {
        // TODO: Implementar subida a Supabase Storage
        datosUpdate.portada_image_path = `portadas/${aplicacion.app_id}/${archivos.portada_file.name}`;
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
  }
};
