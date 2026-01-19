/**
 * Servicio de Mis Aplicaciones - Backend
 * Feature: Mis Aplicaciones (Steamworks Dashboard)
 * 
 * Seguridad:
 * - Todas las consultas usan RLS (Row Level Security) de Supabase
 * - Validación de propiedad mediante desarrollador_id (C18)
 * - Solo lectura - sin operaciones de escritura
 * 
 * Este servicio maneja la consulta de aplicaciones del desarrollador
 * autenticado para mostrarlas en la sección "Mis Aplicaciones"
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';

export const myAppsService = {
  /**
   * GET: Obtiene todas las aplicaciones de un desarrollador
   * 
   * RLS Policy: aplicaciones_select_own - Solo permite ver aplicaciones propias
   * 
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.estado_revision - Filtrar por estado (borrador, en_revision, aprobado, etc.)
   * @param {string} filters.search - Buscar por nombre del juego
   * @returns {Promise<Object>} - { data: Array, error: string|null, count: number }
   */
  async obtenerAplicaciones(desarrolladorId, filters = {}) {
    try {
      // Validar que se proporcione el ID del desarrollador
      if (!desarrolladorId) {
        throw new Error('ID de desarrollador requerido');
      }

      // Construir query base
      let query = supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select(`
          id,
          app_id,
          nombre_juego,
          descripcion_corta,
          descripcion_larga,
          estado_revision,
          precio_base_usd,
          etiquetas,
          pago_registro_completado,
          fecha_envio_revision,
          fecha_aprobacion,
          notas_revision,
          created_at,
          updated_at
        `)
        .eq('desarrollador_id', desarrolladorId);

      // Aplicar filtro de estado si se proporciona
      if (filters.estado_revision) {
        // Validar que sea un estado válido
        const estadosValidos = ['borrador', 'en_revision', 'aprobado', 'rechazado', 'publicado'];
        if (!estadosValidos.includes(filters.estado_revision)) {
          throw new Error('Estado de revisión no válido');
        }
        query = query.eq('estado_revision', filters.estado_revision);
      }

      // Aplicar búsqueda por nombre si se proporciona
      if (filters.search && filters.search.trim().length > 0) {
        const searchTerm = filters.search.trim();
        query = query.or(`nombre_juego.ilike.%${searchTerm}%,descripcion_corta.ilike.%${searchTerm}%`);
      }

      // Ordenar por fecha de creación (más recientes primero)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[MY_APPS] Error al obtener aplicaciones:', error);
        throw new Error('Error al obtener aplicaciones');
      }

      return {
        data: data || [],
        error: null,
        count: data?.length || 0
      };

    } catch (error) {
      console.error('[MY_APPS] Error en obtenerAplicaciones:', error);
      return {
        data: [],
        error: error.message,
        count: 0
      };
    }
  },

  /**
   * GET: Obtiene solo las aplicaciones aprobadas de un desarrollador
   * 
   * Usado para la vista principal de "Mis Aplicaciones" donde solo se muestran
   * las aplicaciones que han sido aprobadas por un administrador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Object>} - { data: Array, error: string|null, count: number }
   */
  async obtenerAplicacionesAprobadas(desarrolladorId) {
    return this.obtenerAplicaciones(desarrolladorId, {
      estado_revision: 'aprobado'
    });
  },

  /**
   * GET: Obtiene una aplicación específica por su ID
   * 
   * Seguridad: Verifica que la aplicación pertenezca al desarrollador (C18)
   * 
   * @param {string} aplicacionId - UUID de la aplicación
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Object>} - { data: Object|null, error: string|null }
   */
  async obtenerAplicacionPorId(aplicacionId, desarrolladorId) {
    try {
      // Validar parámetros requeridos
      if (!aplicacionId || !desarrolladorId) {
        throw new Error('ID de aplicación y desarrollador son requeridos');
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(aplicacionId)) {
        throw new Error('Formato de ID de aplicación inválido');
      }

      const { data, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('*')
        .eq('id', aplicacionId)
        .eq('desarrollador_id', desarrolladorId) // Validación de propiedad (C18)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            data: null,
            error: 'Aplicación no encontrada'
          };
        }
        console.error('[MY_APPS] Error al obtener aplicación:', error);
        throw new Error('Error al obtener aplicación');
      }

      return {
        data,
        error: null
      };

    } catch (error) {
      console.error('[MY_APPS] Error en obtenerAplicacionPorId:', error);
      return {
        data: null,
        error: error.message
      };
    }
  },

  /**
   * GET: Obtiene estadísticas de las aplicaciones del desarrollador
   * 
   * Devuelve conteos agrupados por estado_revision para mostrar
   * en el dashboard del desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Object>} - { data: Object|null, error: string|null }
   */
  async obtenerEstadisticas(desarrolladorId) {
    try {
      if (!desarrolladorId) {
        throw new Error('ID de desarrollador requerido');
      }

      const { data, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('estado_revision')
        .eq('desarrollador_id', desarrolladorId);

      if (error) {
        console.error('[MY_APPS] Error al obtener estadísticas:', error);
        throw new Error('Error al obtener estadísticas');
      }

      // Calcular estadísticas por estado
      const stats = {
        total: data?.length || 0,
        borrador: 0,
        en_revision: 0,
        aprobado: 0,
        rechazado: 0,
        publicado: 0
      };

      data?.forEach(app => {
        if (stats.hasOwnProperty(app.estado_revision)) {
          stats[app.estado_revision]++;
        }
      });

      return {
        data: stats,
        error: null
      };

    } catch (error) {
      console.error('[MY_APPS] Error en obtenerEstadisticas:', error);
      return {
        data: null,
        error: error.message
      };
    }
  }
};
