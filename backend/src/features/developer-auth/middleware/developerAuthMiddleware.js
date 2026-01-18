/**
 * Middleware de Autenticación para Desarrolladores
 * Verifica tokens y rol de desarrollador (C18, C15)
 * Con gestión robusta de sesiones (RNF-008)
 */

import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';
import { sessionService } from '../../../shared/services/sessionService.js';
import {
  auditService,
  ACCIONES_AUDITORIA,
  RESULTADOS,
} from '../../../shared/services/auditService.js';

/**
 * Middleware: Requiere autenticación de desarrollador
 * Verifica que el usuario tenga sesión válida y sea desarrollador
 * Con validación robusta de sesión en BD (C15)
 */
export const requireDesarrollador = async (req, res, next) => {
  try {
    // Obtener token del header Authorization o de cookies
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token de autorización no proporcionado',
      });
    }

    // Verificar token con Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado',
      });
    }

    // Verificar que el email esté confirmado
    if (!user.email_confirmed_at) {
      await auditService.registrarAccesoNoAutorizado(
        user.id,
        `desarrollador:${user.email}`,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent'),
        'Intento de acceso con email no verificado',
      );

      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        mensaje:
          'Debes verificar tu correo electrónico para acceder a esta función',
      });
    }

    // Validar sesión en BD (C15 - Gestión Robusta de Sesiones)
    const sesionValida = await sessionService.validarSesion(token);
    if (!sesionValida) {
      // Registrar acceso con sesión inválida
      await auditService.registrarAccesoNoAutorizado(
        user.id,
        `desarrollador:${user.email}`,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent'),
        'Sesión inválida o expirada en BD',
      );

      return res.status(401).json({
        success: false,
        mensaje: 'Sesión inválida o expirada',
      });
    }

    // Verificar que sea desarrollador activo (C18) - usando supabaseAdmin
    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .select('id, rol, cuenta_activa, mfa_habilitado, nombre_legal')
      .eq('id', user.id)
      .eq('cuenta_activa', true)
      .single();

    if (devError || !desarrollador) {
      // Registrar intento de acceso no autorizado
      await auditService.registrarAccesoNoAutorizado(
        user.id,
        `desarrollador:${user.email}`,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent'),
        'No es un desarrollador registrado o cuenta inactiva',
      );

      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado: No es un desarrollador registrado',
      });
    }

    // Adjuntar información del desarrollador al request
    req.desarrollador = desarrollador;
    req.user = user;

    next();
  } catch (error) {
    console.error(
      '[MIDDLEWARE] Error en verificación de desarrollador:',
      error,
    );
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno de autenticación',
    });
  }
};

/**
 * Middleware: Requiere rol de desarrollador admin
 * Para operaciones especiales que requieren permisos elevados
 */
export const requireDesarrolladorAdmin = (req, res, next) => {
  // Primero verificar que sea desarrollador
  requireDesarrollador(req, res, (err) => {
    if (err) {
      console.error(
        '[MIDDLEWARE] Error en verificación de desarrollador (admin):',
        err,
      );
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno de autenticación',
      });
    }

    // Verificar que el desarrollador esté presente y tenga rol de admin
    if (!req.desarrollador || req.desarrollador.rol !== 'desarrollador_admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado: Requiere permisos de administrador',
      });
    }

    return next();
  });
};

/**
 * Middleware: Verificar MFA si está habilitado (RNF-001, C14)
 * Para operaciones de alto riesgo
 */
export const requireMfaVerificado = async (req, res, next) => {
  try {
    if (!req.desarrollador) {
      return res.status(401).json({
        success: false,
        mensaje: 'Desarrollador no autenticado',
      });
    }

    // Si MFA está habilitado, verificar que esté verificado en esta sesión
    if (req.desarrollador.mfa_habilitado) {
      // Extraer token del header
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          mensaje: 'Token no proporcionado',
        });
      }

      // Verificar MFA en la sesión de BD
      const { data: sesion } = await supabaseAdmin
        .from('sesiones_desarrolladores')
        .select('mfa_verificado')
        .eq('token_hash', sessionService.hashToken(token))
        .eq('activa', true)
        .single();

      if (!sesion || !sesion.mfa_verificado) {
        // Registrar intento de acceso sin MFA verificado
        await auditService.registrarEvento({
          desarrolladorId: req.user.id,
          accion: ACCIONES_AUDITORIA.MFA_FALLIDO,
          resultado: RESULTADOS.FALLIDO,
          detalles: {
            razon: 'Operación de alto riesgo requiere MFA verificado',
            operacion: req.path,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
        });

        return res.status(403).json({
          success: false,
          mensaje: 'Esta operación requiere verificación MFA',
          mfaRequired: true,
        });
      }
    }

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error en verificación MFA:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error en verificación de seguridad',
    });
  }
};
