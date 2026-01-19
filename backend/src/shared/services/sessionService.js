/**
 * Servicio de Gestión de Sesiones
 * Grupo 2 - Steamworks
 * 
 * Implementa:
 * - C15: Validación de sesión robusta
 * - Gestión de tokens y refresh tokens
 * - Control de expiración y sesiones activas
 * - MFA en sesiones
 */

import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

/**
 * Duración de sesiones
 */
const SESSION_DURATION = {
  ACCESS_TOKEN: 24 * 60 * 60 * 1000, // 24 horas
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 días
  MFA_GRACE_PERIOD: 5 * 60 * 1000 // 5 minutos para completar MFA
};

export const sessionService = {
  /**
   * Crea una nueva sesión de desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador
   * @param {string} accessToken - Token de acceso de Supabase
   * @param {string} refreshToken - Refresh token de Supabase
   * @param {string} ipAddress - IP del cliente
   * @param {string} userAgent - User agent
   * @param {boolean} mfaHabilitado - Si el usuario tiene MFA habilitado
   * @returns {Promise<Object>} - Sesión creada
   */
  async crearSesion({
    desarrolladorId,
    accessToken,
    refreshToken,
    ipAddress,
    userAgent,
    mfaHabilitado = false
  }) {
    try {
      // Hash de los tokens para almacenamiento seguro
      const tokenHash = this.hashToken(accessToken);
      const refreshTokenHash = refreshToken ? this.hashToken(refreshToken) : null;

      const fechaExpiracion = new Date(Date.now() + SESSION_DURATION.ACCESS_TOKEN);

      // Insertar sesión en la tabla
      const { data, error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .insert({
          desarrollador_id: desarrolladorId,
          token_hash: tokenHash,
          refresh_token_hash: refreshTokenHash,
          fecha_expiracion: fechaExpiracion.toISOString(),
          activa: true,
          ip_address: ipAddress,
          user_agent: userAgent,
          mfa_verificado: !mfaHabilitado // Si no tiene MFA, marcar como verificado automáticamente
        })
        .select()
        .single();

      if (error) {
        console.error('Error al crear sesión:', error);
        throw new Error('Error al crear sesión');
      }

      console.log(`[SESSION] Sesión creada para desarrollador: ${desarrolladorId}`);
      return data;
    } catch (error) {
      console.error('Error en crearSesion:', error);
      throw error;
    }
  },

  /**
   * Valida una sesión activa
   * 
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<Object|null>} - Sesión válida o null
   */
  async validarSesion(accessToken) {
    try {
      const tokenHash = this.hashToken(accessToken);

      const { data, error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('activa', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Verificar que no haya expirado
      const fechaExpiracion = new Date(data.fecha_expiracion);
      if (fechaExpiracion < new Date()) {
        // Marcar sesión como inactiva
        await this.invalidarSesion(data.id, 'expirada');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error al validar sesión:', error);
      return null;
    }
  },

  /**
   * Invalida una sesión (logout o expiración)
   * 
   * @param {string} sesionId - UUID de la sesión
   * @param {string} motivo - Motivo de invalidación
   */
  async invalidarSesion(sesionId, motivo = 'logout') {
    try {
      const { error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .update({ activa: false })
        .eq('id', sesionId);

      if (error) {
        console.error('Error al invalidar sesión:', error);
        throw error;
      }

      console.log(`[SESSION] Sesión ${sesionId} invalidada: ${motivo}`);
    } catch (error) {
      console.error('Error en invalidarSesion:', error);
      throw error;
    }
  },

  /**
   * Invalida todas las sesiones de un desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador
   */
  async invalidarTodasSesiones(desarrolladorId) {
    try {
      const { error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .update({ activa: false })
        .eq('desarrollador_id', desarrolladorId)
        .eq('activa', true);

      if (error) {
        console.error('Error al invalidar todas las sesiones:', error);
        throw error;
      }

      console.log(`[SESSION] Todas las sesiones invalidadas para: ${desarrolladorId}`);
    } catch (error) {
      console.error('Error en invalidarTodasSesiones:', error);
      throw error;
    }
  },

  /**
   * Marca una sesión como MFA verificado
   * 
   * @param {string} sesionId - UUID de la sesión
   */
  async marcarMFAVerificado(sesionId) {
    try {
      const { error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .update({ mfa_verificado: true })
        .eq('id', sesionId);

      if (error) {
        console.error('Error al marcar MFA verificado:', error);
        throw error;
      }

      console.log(`[SESSION] MFA verificado para sesión: ${sesionId}`);
    } catch (error) {
      console.error('Error en marcarMFAVerificado:', error);
      throw error;
    }
  },

  /**
   * Obtiene sesiones activas de un desarrollador
   * 
   * @param {string} desarrolladorId - UUID del desarrollador
   * @returns {Promise<Array>} - Lista de sesiones activas
   */
  async obtenerSesionesActivas(desarrolladorId) {
    const { data, error } = await supabaseAdmin
      .from('sesiones_desarrolladores')
      .select('id, fecha_inicio, fecha_expiracion, ip_address, user_agent, mfa_verificado')
      .eq('desarrollador_id', desarrolladorId)
      .eq('activa', true)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('Error al obtener sesiones activas:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Limpia sesiones expiradas (tarea de mantenimiento)
   */
  async limpiarSesionesExpiradas() {
    try {
      const { error } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .update({ activa: false })
        .eq('activa', true)
        .lt('fecha_expiracion', new Date().toISOString());

      if (error) {
        console.error('Error al limpiar sesiones expiradas:', error);
        throw error;
      }

      console.log('[SESSION] Sesiones expiradas limpiadas');
    } catch (error) {
      console.error('Error en limpiarSesionesExpiradas:', error);
    }
  },

  /**
   * Hash de token usando SHA-256
   * 
   * @param {string} token - Token a hashear
   * @returns {string} - Hash del token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Verifica si una sesión requiere MFA y no está verificada
   * 
   * @param {Object} sesion - Objeto de sesión
   * @returns {boolean} - True si requiere MFA
   */
  requiereMFA(sesion) {
    return sesion && !sesion.mfa_verificado;
  }
};

/**
 * Middleware para validar sesión en requests
 */
export async function validarSesionMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      });
    }

    const token = authHeader.substring(7);

    // Validar sesión
    const sesion = await sessionService.validarSesion(token);

    if (!sesion) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    // Adjuntar información de sesión al request
    req.sesion = sesion;
    req.desarrolladorId = sesion.desarrollador_id;

    // Verificar si requiere MFA
    if (sessionService.requiereMFA(sesion)) {
      return res.status(403).json({
        success: false,
        message: 'Se requiere verificación de segundo factor (MFA)',
        requiere_mfa: true
      });
    }

    next();
  } catch (error) {
    console.error('Error en validarSesionMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar sesión'
    });
  }
}
