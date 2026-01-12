/**
 * Servicio de Auditoría - Logging de Acciones del Sistema
 * Grupo 2 - Steamworks
 * 
 * Implementa:
 * - RNF-008: Registro de eventos inmutable
 * - Logging de todas las acciones críticas
 * - Integración con tabla logs_auditoria_desarrolladores
 */

import { supabaseAdmin } from '../config/supabase.js';

/**
 * Tipos de acciones auditables
 */
export const ACCIONES_AUDITORIA = {
  // Autenticación
  REGISTRO: 'registro',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FALLIDO: 'login_fallido',
  SESION_EXPIRADA: 'sesion_expirada',
  
  // MFA
  MFA_HABILITADO: 'mfa_habilitado',
  MFA_DESHABILITADO: 'mfa_deshabilitado',
  MFA_VERIFICADO: 'mfa_verificado',
  MFA_FALLIDO: 'mfa_fallido',
  
  // Gestión de Datos
  ACTUALIZAR_PERFIL: 'actualizar_perfil',
  ACTUALIZAR_DATOS_BANCARIOS: 'actualizar_datos_bancarios',
  ACTUALIZAR_PASSWORD: 'actualizar_password',
  
  // Aplicaciones
  CREAR_APLICACION: 'crear_aplicacion',
  ENVIAR_REVISION: 'enviar_revision',
  ACTUALIZAR_APLICACION: 'actualizar_aplicacion',
  
  // Claves
  GENERAR_CLAVE: 'generar_clave',
  DESACTIVAR_CLAVE: 'desactivar_clave',
  
  // Precios
  ACTUALIZAR_PRECIO: 'actualizar_precio',
  
  // Seguridad
  INTENTO_ACCESO_NO_AUTORIZADO: 'intento_acceso_no_autorizado',
  SOLICITUD_BLOQUEADA_RATE_LIMIT: 'solicitud_bloqueada_rate_limit'
};

/**
 * Resultados de acciones
 */
export const RESULTADOS = {
  EXITOSO: 'exitoso',
  FALLIDO: 'fallido',
  BLOQUEADO: 'bloqueado'
};

/**
 * Servicio de Auditoría
 */
export const auditService = {
  /**
   * Registra un evento de auditoría en la base de datos
   * 
   * @param {Object} evento - Datos del evento
   * @param {string} evento.desarrolladorId - UUID del desarrollador (null si no aplicable)
   * @param {string} evento.accion - Acción realizada (usar ACCIONES_AUDITORIA)
   * @param {string} evento.recurso - Recurso afectado (ej: 'aplicacion:app123')
   * @param {Object} evento.detalles - Detalles adicionales en JSON
   * @param {string} evento.ipAddress - IP del cliente
   * @param {string} evento.userAgent - User agent del navegador
   * @param {string} evento.resultado - Resultado (usar RESULTADOS)
   * @returns {Promise<string>} - ID del log creado
   */
  async registrarEvento({
    desarrolladorId = null,
    accion,
    recurso = null,
    detalles = {},
    ipAddress = null,
    userAgent = null,
    resultado = RESULTADOS.EXITOSO
  }) {
    try {
      // Insertar directamente en la tabla logs_auditoria_desarrolladores
      const { data, error } = await supabaseAdmin
        .from('logs_auditoria_desarrolladores')
        .insert({
          desarrollador_id: desarrolladorId,
          accion: accion,
          recurso: recurso,
          detalles: detalles,
          ip_address: ipAddress,
          user_agent: userAgent,
          resultado: resultado
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error al registrar auditoría:', error);
        // No lanzar error para no bloquear la operación principal
        return null;
      }

      console.log(`[AUDIT] ${accion} - ${resultado} - Desarrollador: ${desarrolladorId || 'N/A'}`);
      return data?.id;
    } catch (error) {
      console.error('Error crítico en auditoría:', error);
      return null;
    }
  },

  /**
   * Registra un evento de registro exitoso
   */
  async registrarRegistro(desarrolladorId, ipAddress, userAgent, detalles = {}) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.REGISTRO,
      detalles: {
        ...detalles,
        timestamp_registro: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.EXITOSO
    });
  },

  /**
   * Registra un evento de login exitoso
   */
  async registrarLogin(desarrolladorId, ipAddress, userAgent, detalles = {}) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.LOGIN,
      detalles: {
        ...detalles,
        timestamp_login: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.EXITOSO
    });
  },

  /**
   * Registra un intento de login fallido
   */
  async registrarLoginFallido(email, razon, ipAddress, userAgent) {
    return this.registrarEvento({
      desarrolladorId: null,
      accion: ACCIONES_AUDITORIA.LOGIN_FALLIDO,
      detalles: {
        email,
        razon,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.FALLIDO
    });
  },

  /**
   * Registra un evento de logout
   */
  async registrarLogout(desarrolladorId, ipAddress, userAgent) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.LOGOUT,
      detalles: {
        timestamp_logout: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.EXITOSO
    });
  },

  /**
   * Registra actualización de perfil
   */
  async registrarActualizacionPerfil(desarrolladorId, camposActualizados, ipAddress, userAgent) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.ACTUALIZAR_PERFIL,
      detalles: {
        campos_actualizados: camposActualizados,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.EXITOSO
    });
  },

  /**
   * Registra actualización de datos bancarios (sensible)
   */
  async registrarActualizacionDatosBancarios(desarrolladorId, ipAddress, userAgent) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.ACTUALIZAR_DATOS_BANCARIOS,
      recurso: `desarrollador:${desarrolladorId}`,
      detalles: {
        timestamp: new Date().toISOString(),
        tipo_operacion: 'datos_bancarios_sensibles'
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.EXITOSO
    });
  },

  /**
   * Registra intento de acceso no autorizado
   */
  async registrarAccesoNoAutorizado(desarrolladorId, recurso, ipAddress, userAgent, razon) {
    return this.registrarEvento({
      desarrolladorId,
      accion: ACCIONES_AUDITORIA.INTENTO_ACCESO_NO_AUTORIZADO,
      recurso,
      detalles: {
        razon,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.BLOQUEADO
    });
  },

  /**
   * Registra solicitud bloqueada por rate limiting
   */
  async registrarRateLimitExcedido(endpoint, ipAddress, userAgent) {
    return this.registrarEvento({
      desarrolladorId: null,
      accion: ACCIONES_AUDITORIA.SOLICITUD_BLOQUEADA_RATE_LIMIT,
      recurso: `endpoint:${endpoint}`,
      detalles: {
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      resultado: RESULTADOS.BLOQUEADO
    });
  },

  /**
   * Obtiene logs de auditoría de un desarrollador
   */
  async obtenerLogsPorDesarrollador(desarrolladorId, limite = 50) {
    const { data, error } = await supabaseAdmin
      .from('logs_auditoria_desarrolladores')
      .select('*')
      .eq('desarrollador_id', desarrolladorId)
      .order('timestamp', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('Error al obtener logs:', error);
      throw error;
    }

    return data;
  },

  /**
   * Obtiene estadísticas de auditoría
   */
  async obtenerEstadisticas(desarrolladorId, diasAtras = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - diasAtras);

    const { data, error } = await supabaseAdmin
      .from('logs_auditoria_desarrolladores')
      .select('accion, resultado')
      .eq('desarrollador_id', desarrolladorId)
      .gte('timestamp', fechaInicio.toISOString());

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }

    // Agrupar por acción y resultado
    const stats = data.reduce((acc, log) => {
      const key = `${log.accion}_${log.resultado}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total_eventos: data.length,
      periodo_dias: diasAtras,
      por_accion: stats
    };
  }
};

/**
 * Helper para extraer IP del request
 */
export function obtenerIPDesdeRequest(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         null;
}

/**
 * Helper para extraer User Agent del request
 */
export function obtenerUserAgentDesdeRequest(req) {
  return req.headers['user-agent'] || null;
}
