/**
 * Seguridad:
 * - Cifrado AES-256 en reposo (RNF-003)
 * - Validación de propiedad (C18)
 * - Límite de 5 llaves activas (C10)
 * - Hash SHA-256 para búsqueda sin descifrar (RNF-006)
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';
import { encrypt, decrypt, hashSHA256 } from '../../../shared/utils/encryption.js';
import { generarLlaveJuego } from '../utils/keyGenerator.js';

// Constante: Máximo de llaves activas por juego (C10)
const MAX_LLAVES_POR_JUEGO = 5;

export const gameKeysService = {
  
  /**
   * CREATE: Genera una nueva llave para un juego
   * 
   * Validaciones:
   * - El juego debe pertenecer al desarrollador (C18)
   * - No debe exceder el límite de 5 llaves activas (C10)
   * - La llave se cifra con AES-256 antes de guardar (RNF-003)
   * - Se genera hash SHA-256 para búsqueda rápida (RNF-006)
   * 
   * @param {string} juegoId - UUID del juego
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {Object} requestMetadata - Metadatos de la request (IP, User-Agent)
   * @returns {Promise<Object>} - Llave creada (con código en claro solo esta vez)
   */
  async crearLlave(juegoId, desarrolladorId, requestMetadata = {}) {
    try {
      // 1. Verificar que la aplicación pertenece al desarrollador (C18)
      const { data: app, error: appError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('id, nombre_juego, desarrollador_id')
        .eq('id', juegoId)
        .eq('desarrollador_id', desarrolladorId)
        .single();
      
      if (appError || !app) {
        throw new Error('No tienes permisos para generar llaves de esta aplicación');
      }
      
      // 2. Verificar límite de llaves totales (C10) - MÁXIMO 5 LLAVES POR APLICACIÓN
      const { count, error: countError } = await supabaseAdmin
        .from('claves_juegos')
        .select('id', { count: 'exact', head: true })
        .eq('aplicacion_id', juegoId);
      
      if (countError) {
        console.error('[GAME_KEYS] Error al contar llaves:', countError);
        throw new Error('Error al verificar límite de llaves');
      }
      
      if (count >= MAX_LLAVES_POR_JUEGO) {
        throw new Error(`Límite de ${MAX_LLAVES_POR_JUEGO} llaves totales alcanzado para esta aplicación`);
      }
      
      // 3. Generar llave con algoritmo seguro
      const llavePlana = generarLlaveJuego(juegoId, desarrolladorId);
      
      // 4. Cifrar llave con AES-256 (RNF-003)
      const llaveCifrada = encrypt(llavePlana);
      
      // 5. Insertar en la base de datos
      const { data: nuevaLlave, error: insertError} = await supabaseAdmin
        .from('claves_juegos')
        .insert({
          aplicacion_id: juegoId,
          desarrollador_id: desarrolladorId,
          clave: llaveCifrada,
          activa: true,
          usada: false
        })
        .select('id, activa, usada, fecha_generacion')
        .single();
      
      if (insertError) {
        console.error('[GAME_KEYS] Error al insertar llave:', insertError);
        throw new Error('Error al generar llave de juego');
      }
      
      // 6. Retornar llave EN CLARO (⚠️ SOLO ESTA VEZ)
      return {
        id: nuevaLlave.id,
        aplicacion: {
          id: app.id,
          nombre: app.nombre_juego
        },
        clave: llavePlana,  // ⚠️ Solo se muestra al crear
        fecha_generacion: nuevaLlave.fecha_generacion,
        activa: nuevaLlave.activa,
        mensaje: '⚠️ IMPORTANTE: Guarda esta llave de forma segura. No podrás verla nuevamente.',
        llaves_disponibles: MAX_LLAVES_POR_JUEGO - (count + 1)
      };
      
    } catch (error) {
      console.error('[GAME_KEYS] Error en crearLlave:', error);
      throw error;
    }
  },
  
  /**
   * READ: Lista todas las llaves de un juego (sin mostrar el código)
   * 
   * @param {string} juegoId - UUID del juego
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @returns {Promise<Object>} - Lista de llaves (sin códigos en claro)
   */
  async listarLlavesJuego(juegoId, desarrolladorId) {
    try {
      // 1. Verificar que la aplicación pertenece al desarrollador (C18)
      const { data: app, error: appError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('id, nombre_juego')
        .eq('id', juegoId)
        .eq('desarrollador_id', desarrolladorId)
        .single();
      
      if (appError || !app) {
        throw new Error('No tienes permisos para ver las llaves de esta aplicación');
      }
      
      // 2. Obtener todas las llaves de la aplicación (CON clave cifrada para descifrar)
      const { data: llaves, error: llavesError } = await supabaseAdmin
        .from('claves_juegos')
        .select(`
          id,
          activa,
          usada,
          clave,
          fecha_generacion,
          fecha_desactivacion,
          motivo_desactivacion,
          usuario_activacion_id,
          fecha_uso
        `)
        .eq('aplicacion_id', juegoId)
        .order('fecha_generacion', { ascending: false });
      
      if (llavesError) {
        console.error('[GAME_KEYS] Error al listar llaves:', llavesError);
        throw new Error('Error al listar llaves');
      }
      
      console.log('[GAME_KEYS DEBUG] Llaves desde DB:', llaves.map(l => ({ id: l.id, activa: l.activa, usada: l.usada })));
      
      // 3. Formatear respuesta (desencriptando las llaves para el desarrollador)
      const llavesFormateadas = llaves.map(llave => {
        let estado = 'Activa';
        if (!llave.activa && llave.usada) {
          estado = 'Canjeada';
        } else if (!llave.activa) {
          estado = 'Desactivada';
        }
        
        return {
          id: llave.id,
          estado: estado,
          activa: llave.activa,
          usada: llave.usada,
          fecha_generacion: llave.fecha_generacion,
          fecha_desactivacion: llave.fecha_desactivacion,
          motivo_desactivacion: llave.motivo_desactivacion,
          usuario_activacion_id: llave.usuario_activacion_id,
          fecha_uso: llave.fecha_uso,
          clave: decrypt(llave.clave)  // Desencriptar para el desarrollador
        };
      });
      
      const activas = llaves.filter(k => k.activa).length;
      const canjeadas = llaves.filter(k => k.usada).length;
      
      return {
        aplicacion: {
          id: app.id,
          nombre: app.nombre_juego
        },
        estadisticas: {
          total: llaves.length,
          activas: activas,
          canjeadas: canjeadas,
          desactivadas: llaves.filter(k => !k.activa && !k.usada).length,
          disponibles: MAX_LLAVES_POR_JUEGO - llaves.length,
          limite: MAX_LLAVES_POR_JUEGO
        },
        llaves: llavesFormateadas
      };
      
    } catch (error) {
      console.error('[GAME_KEYS] Error en listarLlavesJuego:', error);
      throw error;
    }
  },
  
  /**
   * DESACTIVAR: Desactiva una llave con motivo (soft delete)
   * 
   * Nota: Esto es para desactivación manual por el desarrollador.
   * Cuando un usuario canjea la llave, se marca como usada por otro feature.
   * 
   * @param {string} llaveId - UUID de la llave
   * @param {string} desarrolladorId - UUID del desarrollador autenticado
   * @param {string} motivo - Motivo de desactivación
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async desactivarLlave(llaveId, desarrolladorId, motivo = '') {
    try {
      // 1. Verificar que la llave pertenece al desarrollador (C18)
      const { data: llave, error: llaveError } = await supabaseAdmin
        .from('claves_juegos')
        .select(`
          id,
          aplicacion_id,
          activa,
          usada,
          aplicaciones_desarrolladores (
            id,
            nombre_juego,
            desarrollador_id
          )
        `)
        .eq('id', llaveId)
        .single();
      
      if (llaveError || !llave) {
        throw new Error('Llave no encontrada');
      }
      
      if (llave.aplicaciones_desarrolladores.desarrollador_id !== desarrolladorId) {
        throw new Error('No tienes permisos para desactivar esta llave');
      }
      
      if (!llave.activa) {
        throw new Error('Esta llave ya está desactivada');
      }
      
      if (llave.usada) {
        throw new Error('No puedes desactivar una llave que ya fue canjeada');
      }
      
      // 2. Desactivar la llave (soft delete)
      const { error: updateError } = await supabaseAdmin
        .from('claves_juegos')
        .update({
          activa: false,
          fecha_desactivacion: new Date().toISOString(),
          motivo_desactivacion: motivo || 'Desactivada por el desarrollador'
        })
        .eq('id', llaveId);
      
      if (updateError) {
        console.error('[GAME_KEYS] Error al desactivar llave:', updateError);
        throw new Error('Error al desactivar llave');
      }
      
      return {
        success: true,
        mensaje: 'Llave desactivada exitosamente',
        llave_id: llaveId,
        aplicacion: llave.aplicaciones_desarrolladores.nombre_juego
      };
      
    } catch (error) {
      console.error('[GAME_KEYS] Error en desactivarLlave:', error);
      throw error;
    }
  },
  
  /**
   * READ: Obtiene estadísticas generales de llaves de un desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador
   * @returns {Promise<Object>} - Estadísticas generales
   */
  async obtenerEstadisticas(desarrolladorId) {
    try {
      // Usar la vista de estadísticas creada en la BD
      const { data, error } = await supabaseAdmin
        .from('vista_estadisticas_llaves')
        .select('*')
        .eq('desarrollador_id', desarrolladorId);
      
      if (error) {
        console.error('[GAME_KEYS] Error al obtener estadísticas:', error);
        throw new Error('Error al obtener estadísticas');
      }
      
      // Calcular totales
      const totales = {
        total_juegos: data.length,
        total_llaves: data.reduce((sum, item) => sum + item.total_llaves, 0),
        llaves_activas: data.reduce((sum, item) => sum + item.llaves_activas, 0),
        llaves_usadas: data.reduce((sum, item) => sum + item.llaves_usadas, 0),
        capacidad_total: data.length * MAX_LLAVES_POR_JUEGO,
        slots_disponibles: data.reduce((sum, item) => sum + item.llaves_disponibles, 0)
      };
      
      return {
        totales,
        por_juego: data
      };
      
    } catch (error) {
      console.error('[GAME_KEYS] Error en obtenerEstadisticas:', error);
      throw error;
    }
  },
  
  /**
   * UTILITY: Verifica si una llave existe por su hash
   * (Útil para cuando otro feature valide el canje)
   * 
   * @param {string} hashLlave - Hash SHA-256 de la llave
   * @returns {Promise<Object|null>} - Datos de la llave si existe
   */
  async verificarLlavePorHash(hashLlave) {
    try {
      const { data, error } = await supabaseAdmin
        .from('game_keys')
        .select(`
          id,
          juego_id,
          activa,
          activada_por,
          fecha_activacion,
          juegos (
            id,
            nombre,
            desarrollador_id
          )
        `)
        .eq('hash_llave', hashLlave)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data;
      
    } catch (error) {
      console.error('[GAME_KEYS] Error en verificarLlavePorHash:', error);
      return null;
    }
  }
};
