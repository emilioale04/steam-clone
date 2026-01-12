/**
 * Middleware de Autenticación para Desarrolladores
 * Verifica tokens y rol de desarrollador (C18, C15)
 */

import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';

/**
 * Middleware: Requiere autenticación de desarrollador
 * Verifica que el usuario tenga sesión válida y sea desarrollador
 */
export const requireDesarrollador = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token de autorización no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token con Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado'
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
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado: No es un desarrollador registrado'
      });
    }

    // Adjuntar información del desarrollador al request
    req.desarrollador = desarrollador;
    req.user = user;

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error en verificación de desarrollador:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno de autenticación'
    });
  }
};

/**
 * Middleware: Requiere rol de desarrollador admin
 * Para operaciones especiales que requieren permisos elevados
 */
export const requireDesarrolladorAdmin = async (req, res, next) => {
  try {
    // Primero verificar que sea desarrollador
    await new Promise((resolve, reject) => {
      requireDesarrollador(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verificar rol de admin
    if (req.desarrollador.rol !== 'desarrollador_admin') {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado: Requiere permisos de administrador'
      });
    }

    next();
  } catch (error) {
    // El error ya fue manejado por requireDesarrollador
    return;
  }
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
        mensaje: 'Desarrollador no autenticado'
      });
    }

    // Si MFA está habilitado, verificar que esté verificado en esta sesión
    if (req.desarrollador.mfa_habilitado) {
      // TODO: Implementar verificación de sesión MFA
      // Por ahora, solo verificamos que MFA esté configurado
      console.log('[MFA] Verificación MFA requerida para operación de alto riesgo');
    }

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error en verificación MFA:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error en verificación de seguridad'
    });
  }
};
