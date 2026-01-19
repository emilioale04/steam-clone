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
    EDITAR_FORO: 'editar_foro',
    CERRAR_FORO: 'cerrar_foro',
    ELIMINAR_FORO: 'eliminar_foro',
    
    // Hilos y Comentarios
    CREAR_HILO: 'crear_hilo',
    EDITAR_HILO: 'editar_hilo',
    ELIMINAR_HILO: 'eliminar_hilo',
    CREAR_COMENTARIO: 'crear_comentario',
    EDITAR_COMENTARIO: 'editar_comentario',
    ELIMINAR_COMENTARIO: 'eliminar_comentario',
    
    // Moderación
    BANEAR_USUARIO: 'banear_usuario',
    DESBANEAR_USUARIO: 'desbanear_usuario',
    CAMBIAR_ROL: 'cambiar_rol',
    REVOCAR_BANEO: 'revocar_baneo',
    
    // Anuncios
    CREAR_ANUNCIO: 'crear_anuncio',
    FIJAR_ANUNCIO: 'fijar_anuncio',
    DESFIJAR_ANUNCIO: 'desfijar_anuncio',
    ELIMINAR_ANUNCIO: 'eliminar_anuncio',
    
    // Miembros
    AGREGAR_MIEMBRO: 'agregar_miembro',
    EXPULSAR_MIEMBRO: 'expulsar_miembro',
    CAMBIAR_RANGO_MIEMBRO: 'cambiar_rango_miembro',
    
    // Reportes
    REPORTAR_FORO: 'reportar_foro',
    REPORTAR_HILO: 'reportar_hilo',
    REPORTAR_COMENTARIO: 'reportar_comentario',
    
    // Configuración
    MODIFICAR_REGLAS: 'modificar_reglas',
    CONFIGURAR_METADATOS: 'configurar_metadatos',
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
 * Registra revocación de baneo
 */
export async function registrarRevocarBaneo(moderadorId, grupoId, usuarioId, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.REVOCAR_BANEO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_id: usuarioId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra agregar miembro
 */
export async function registrarAgregarMiembro(moderadorId, grupoId, usuarioId, rol, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.AGREGAR_MIEMBRO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_agregado: usuarioId,
            rol: rol,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra expulsar miembro
 */
export async function registrarExpulsarMiembro(moderadorId, grupoId, usuarioId, rol, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.EXPULSAR_MIEMBRO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_expulsado: usuarioId,
            rol: rol,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra cambio de rango de miembro
 */
export async function registrarCambiarRangoMiembro(moderadorId, grupoId, usuarioId, rolAnterior, rolNuevo, ipAddress) {
    return registrarLogComunidad({
        userId: moderadorId,
        accion: ACCIONES_COMUNIDAD.CAMBIAR_RANGO_MIEMBRO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            usuario_id: usuarioId,
            rol_anterior: rolAnterior,
            rol_nuevo: rolNuevo,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra creación de anuncio
 */
export async function registrarCrearAnuncio(userId, grupoId, anuncioId, fijado, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CREAR_ANUNCIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            anuncio_id: anuncioId,
            fijado: fijado,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra fijar anuncio
 */
export async function registrarFijarAnuncio(userId, grupoId, anuncioId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.FIJAR_ANUNCIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            anuncio_id: anuncioId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra desfijar anuncio
 */
export async function registrarDesfijarAnuncio(userId, grupoId, anuncioId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.DESFIJAR_ANUNCIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            anuncio_id: anuncioId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra reporte de foro
 */
export async function registrarReportarForo(reporterId, grupoId, foroId, motivo, ipAddress) {
    return registrarLogComunidad({
        userId: reporterId,
        accion: ACCIONES_COMUNIDAD.REPORTAR_FORO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            foro_id: foroId,
            motivo: motivo,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra reporte de hilo
 */
export async function registrarReportarHilo(reporterId, grupoId, hiloId, motivo, ipAddress) {
    return registrarLogComunidad({
        userId: reporterId,
        accion: ACCIONES_COMUNIDAD.REPORTAR_HILO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            hilo_id: hiloId,
            motivo: motivo,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra reporte de comentario
 */
export async function registrarReportarComentario(reporterId, grupoId, comentarioId, motivo, ipAddress) {
    return registrarLogComunidad({
        userId: reporterId,
        accion: ACCIONES_COMUNIDAD.REPORTAR_COMENTARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            comentario_id: comentarioId,
            motivo: motivo,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra modificación de reglas
 */
export async function registrarModificarReglas(userId, grupoId, reglasActualizadas, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.MODIFICAR_REGLAS,
        recurso: `grupo:${grupoId}`,
        detalles: {
            reglas: reglasActualizadas,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra configuración de metadatos
 */
export async function registrarConfigurarMetadatos(userId, grupoId, metadatos, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CONFIGURAR_METADATOS,
        recurso: `grupo:${grupoId}`,
        detalles: {
            metadatos: metadatos,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra creación de foro
 */
export async function registrarCrearForo(userId, grupoId, foroId, nombre, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CREAR_FORO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            foro_id: foroId,
            nombre: nombre,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra edición de foro
 */
export async function registrarEditarForo(userId, grupoId, foroId, cambios, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.EDITAR_FORO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            foro_id: foroId,
            cambios: cambios,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra eliminación de foro
 */
export async function registrarEliminarForo(userId, grupoId, foroId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.ELIMINAR_FORO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            foro_id: foroId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra creación de hilo
 */
export async function registrarCrearHilo(userId, grupoId, hiloId, titulo, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CREAR_HILO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            hilo_id: hiloId,
            titulo: titulo,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra edición de hilo
 */
export async function registrarEditarHilo(userId, grupoId, hiloId, cambios, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.EDITAR_HILO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            hilo_id: hiloId,
            cambios: cambios,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra eliminación de hilo
 */
export async function registrarEliminarHilo(userId, grupoId, hiloId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.ELIMINAR_HILO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            hilo_id: hiloId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra creación de comentario
 */
export async function registrarCrearComentario(userId, grupoId, comentarioId, hiloId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.CREAR_COMENTARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            comentario_id: comentarioId,
            hilo_id: hiloId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra edición de comentario
 */
export async function registrarEditarComentario(userId, grupoId, comentarioId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.EDITAR_COMENTARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            comentario_id: comentarioId,
            timestamp: new Date().toISOString()
        },
        ipAddress,
        resultado: RESULTADOS.EXITOSO
    });
}

/**
 * Registra eliminación de comentario
 */
export async function registrarEliminarComentario(userId, grupoId, comentarioId, ipAddress) {
    return registrarLogComunidad({
        userId,
        accion: ACCIONES_COMUNIDAD.ELIMINAR_COMENTARIO,
        recurso: `grupo:${grupoId}`,
        detalles: {
            comentario_id: comentarioId,
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
