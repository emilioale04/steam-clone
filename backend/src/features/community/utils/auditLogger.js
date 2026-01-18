/**
 * Utilidades para Logging de Auditoría - Comunidad
 * Grupo 2 - Feature: Community
 * 
 * Sistema de auditoría para acciones de comunidad (grupos, foros, etc.)
 * Similar al sistema de auditoría de desarrolladores pero específico para usuarios
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';

/**
 * Acciones auditables en comunidad
 */
export const ACCIONES_COMUNIDAD = {
    // Grupos
    CREAR_GRUPO: 'crear_grupo',
    ACTUALIZAR_GRUPO: 'actualizar_grupo',
    ELIMINAR_GRUPO: 'eliminar_grupo',
    UNIRSE_GRUPO: 'unirse_grupo',
    ABANDONAR_GRUPO: 'abandonar_grupo',
    
    // Foros
    CREAR_FORO: 'crear_foro',
    CERRAR_FORO: 'cerrar_foro',
    ELIMINAR_FORO: 'eliminar_foro',
    
    // Hilos y Comentarios
    CREAR_HILO: 'crear_hilo',
    ELIMINAR_HILO: 'eliminar_hilo',
    CREAR_COMENTARIO: 'crear_comentario',
    ELIMINAR_COMENTARIO: 'eliminar_comentario',
    
    // Moderación
    BANEAR_USUARIO: 'banear_usuario',
    DESBANEAR_USUARIO: 'desbanear_usuario',
    CAMBIAR_ROL: 'cambiar_rol',
    
    // Anuncios
    CREAR_ANUNCIO: 'crear_anuncio',
    FIJAR_ANUNCIO: 'fijar_anuncio',
    ELIMINAR_ANUNCIO: 'eliminar_anuncio',
};

/**
 * Resultados de acciones
 */
export const RESULTADOS = {
    EXITOSO: 'exitoso',
    FALLIDO: 'fallido',
    BLOQUEADO: 'bloqueado',
};

/**
 * Registra un evento de auditoría en la tabla logs_comunidad
 * 
 * @param {Object} evento - Datos del evento
 * @param {string} evento.userId - UUID del usuario
 * @param {string} evento.accion - Acción realizada (usar ACCIONES_COMUNIDAD)
 * @param {string} evento.recurso - Recurso afectado (ej: 'grupo:123')
 * @param {Object} evento.detalles - Detalles adicionales en JSON
 * @param {string} evento.ipAddress - IP del cliente
 * @param {string} evento.resultado - Resultado (usar RESULTADOS)
 * @returns {Promise<string|null>} - ID del log creado o null si falla
 */
export async function registrarLogComunidad({
    userId,
    accion,
    recurso = null,
    detalles = {},
    ipAddress = null,
    resultado = RESULTADOS.EXITOSO,
}) {
    try {
        const { data, error } = await supabaseAdmin
            .from('logs_comunidad')
            .insert({
                user_id: userId,
                accion: accion,
                recurso: recurso,
                detalles: detalles,
                ip_address: ipAddress,
                resultado: resultado,
                timestamp: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error('[COMMUNITY AUDIT] Error al registrar log:', error);
            return null;
        }

        console.log(
            `[COMMUNITY AUDIT] ${accion} - ${resultado} - Usuario: ${userId} - IP: ${ipAddress || 'N/A'}`
        );
        return data?.id;
    } catch (error) {
        console.error('[COMMUNITY AUDIT] Error crítico:', error);
        return null;
    }
}

/**
 * Extrae la IP del request
 */
export function obtenerIPDesdeRequest(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        null
    );
}

/**
 * Registra creación de grupo
 */
export async function registrarCrearGrupo(userId, grupoId, nombreGrupo, visibilidad, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CREAR_GRUPO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            nombre_grupo: nombreGrupo,
            visibilidad: visibilidad,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra eliminación de grupo
 */
export async function registrarEliminarGrupo(userId, grupoId, nombreGrupo, visibilidad, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.ELIMINAR_GRUPO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            nombre_grupo: nombreGrupo,
            visibilidad: visibilidad,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra actualización de grupo
 */
export async function registrarActualizarGrupo(userId, grupoId, cambios, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.ACTUALIZAR_GRUPO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            campos_actualizados: cambios,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra baneo de usuario
 */
export async function registrarBanearUsuario(moderadorId, grupoId, usuarioId, isPermanent, days, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.BANEAR_USUARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_baneado: usuarioId,
            tipo_baneo: isPermanent ? 'permanente' : 'temporal',
            duracion_dias: days || null,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra desbaneo de usuario
 */
export async function registrarDesbanearUsuario(moderadorId, grupoId, usuarioId, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.DESBANEAR_USUARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_desbaneado: usuarioId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Obtiene logs de un usuario específico
 */
export async function obtenerLogsPorUsuario(userId, limite = 50) {
    const { data, error } = await supabaseAdmin
        .from('logs_comunidad')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limite);

    if (error) {
        console.error('[COMMUNITY AUDIT] Error al obtener logs:', error);
        throw error;
    }

    return data;
}

/**
 * Obtiene logs de un grupo específico
 */
export async function obtenerLogsPorGrupo(grupoId, limite = 100) {
    const recursoPattern = `grupo:${grupoId}`;
    
    const { data, error } = await supabaseAdmin
        .from('logs_comunidad')
        .select('*')
        .eq('recurso', recursoPattern)
        .order('timestamp', { ascending: false })
        .limit(limite);

    if (error) {
        console.error('[COMMUNITY AUDIT] Error al obtener logs del grupo:', error);
        throw error;
    }

    return data;
}
