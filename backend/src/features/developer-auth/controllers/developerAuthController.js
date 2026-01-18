/**
 * Controlador de Autenticación para Desarrolladores (Steamworks)
 * Maneja endpoints de login, registro y gestión de sesión
 * Cumple con: RF-001, RF-002, RNF-008
 */

import { developerAuthService } from '../services/developerAuthService.js';

/**
 * Extrae metadatos de la request para auditoría
 */
function extractRequestMetadata(req) {
  return {
    ip_address: req.ip || req.connection.remoteAddress || 'unknown',
    user_agent: req.get('user-agent') || 'unknown',
  };
}

export const developerAuthController = {
  /**
   * POST /api/desarrolladores/auth/registro
   * Registra un nuevo desarrollador (RF-001)
   */
  async registro(req, res) {
    try {
      const datosRegistro = req.body;

      // Validaciones básicas del servidor (C3, C9)
      if (!datosRegistro.email || !datosRegistro.password) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email y contraseña son requeridos',
        });
      }

      if (!datosRegistro.nombre_legal || !datosRegistro.pais) {
        return res.status(400).json({
          success: false,
          mensaje: 'Nombre legal y país son requeridos',
        });
      }

      if (!datosRegistro.acepto_terminos) {
        return res.status(400).json({
          success: false,
          mensaje: 'Debe aceptar los términos y condiciones',
        });
      }

      // Validar longitud de contraseña (seguridad)
      if (datosRegistro.password.length < 8) {
        return res.status(400).json({
          success: false,
          mensaje: 'La contraseña debe tener al menos 8 caracteres',
        });
      }

      // Extraer metadatos de la request para auditoría
      const requestMetadata = extractRequestMetadata(req);

      const resultado = await developerAuthService.registrarDesarrollador(
        datosRegistro,
        requestMetadata,
      );

      res.status(201).json({
        success: true,
        data: resultado,
        mensaje: 'Desarrollador registrado exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/desarrolladores/auth/login
   * Inicia sesión de desarrollador (RF-002)
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email y contraseña son requeridos',
        });
      }

      // Extraer metadatos de la request para auditoría
      const requestMetadata = extractRequestMetadata(req);

      const resultado = await developerAuthService.iniciarSesion(
        email,
        password,
        requestMetadata,
      );

      // Establecer cookie httpOnly con el token
      res.cookie('session_token', resultado.session.access_token, {
        httpOnly: true,
        secure: false, // En producción cambiar a true con HTTPS
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: resultado,
        mensaje: 'Inicio de sesión exitoso',
      });
    } catch (error) {
      // Manejar error de email no verificado
      if (
        error.code === 'EMAIL_NOT_VERIFIED' ||
        error.message === 'EMAIL_NOT_VERIFIED'
      ) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          mensaje:
            'Debes verificar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.',
        });
      }

      res.status(401).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/desarrolladores/auth/logout
   * Cierra sesión del desarrollador
   */
  async logout(req, res) {
    try {
      // Extraer userId y metadatos para auditoría
      const userId = req.user?.id; // Asumiendo que viene del middleware de autenticación
      const requestMetadata = extractRequestMetadata(req);

      await developerAuthService.cerrarSesion(userId, requestMetadata);

      // Limpiar cookie
      res.clearCookie('session_token');

      res.status(200).json({
        success: true,
        mensaje: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/desarrolladores/auth/reenviar-verificacion
   * Reenvía el correo de verificación de email
   */
  async reenviarVerificacion(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email es requerido',
        });
      }

      const requestMetadata = extractRequestMetadata(req);

      const resultado = await developerAuthService.reenviarCorreoVerificacion(
        email,
        requestMetadata,
      );

      res.status(200).json({
        success: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/desarrolladores/auth/perfil
   * Obtiene el perfil del desarrollador autenticado
   */
  async obtenerPerfil(req, res) {
    try {
      const resultado = await developerAuthService.obtenerDesarrolladorActual();

      res.status(200).json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/desarrolladores/auth/forgot-password
   * Solicita restablecimiento de contraseña
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          mensaje: 'Email es requerido',
        });
      }

      await developerAuthService.solicitarRestablecimientoPassword(email);

      res.status(200).json({
        success: true,
        mensaje:
          'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      });
    } catch (error) {
      // No revelar si el email existe o no (seguridad)
      res.status(200).json({
        success: true,
        mensaje:
          'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      });
    }
  },

  /**
   * POST /api/desarrolladores/auth/reset-password
   * Restablece la contraseña con tokens
   */
  async resetPassword(req, res) {
    try {
      const { password, accessToken, refreshToken } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          mensaje: 'Nueva contraseña es requerida',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          mensaje: 'La contraseña debe tener al menos 8 caracteres',
        });
      }

      const resultado = await developerAuthService.actualizarPassword(
        password,
        accessToken,
        refreshToken,
      );

      res.status(200).json({
        success: true,
        data: resultado,
        mensaje: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/desarrolladores/auth/verificar
   * Verifica si el token actual pertenece a un desarrollador válido
   */
  async verificarDesarrollador(req, res) {
    try {
      const resultado = await developerAuthService.obtenerDesarrolladorActual();

      res.status(200).json({
        success: true,
        data: {
          esDesarrollador: true,
          rol: resultado.desarrollador.rol,
          cuenta_activa: resultado.desarrollador.cuenta_activa,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        data: {
          esDesarrollador: false,
        },
        mensaje: error.message,
      });
    }
  },
};
