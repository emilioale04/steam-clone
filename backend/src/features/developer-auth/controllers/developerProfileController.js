/**
 * Controlador de Gestión de Perfil de Desarrolladores (Steamworks)
 * Maneja actualización de información personal y bancaria
 * Cumple con: RF-003 (Actualización de Información)
 *
 * Implementa:
 * - RNF-001: Validación MFA para cambios sensibles
 * - C2: Cifrado de datos bancarios (AES-256)
 * - RNF-008: Auditoría de cambios
 * - Política ABAC: Restricción de 5 días para cambios
 */

import { developerProfileService } from '../services/developerProfileService.js';
import mfaService from '../../mfa/services/mfaService.js';

export const developerProfileController = {
  /**
   * Obtener perfil completo del desarrollador
   * Retorna información personal y bancaria (descifrada)
   */
  async obtenerPerfilCompleto(req, res) {
    try {
      const desarrolladorId = req.user.id;

      const perfil =
        await developerProfileService.obtenerPerfilCompleto(desarrolladorId);

      res.status(200).json({
        success: true,
        data: perfil,
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        mensaje: error.message || 'Error al obtener perfil',
      });
    }
  },

  /**
   * Actualizar información personal (RF-003)
   * Requiere verificación MFA
   * Valida restricción de 5 días desde última modificación
   */
  async actualizarInformacionPersonal(req, res) {
    try {
      const desarrolladorId = req.user.id;
      const { nombre_legal, telefono, codigoMFA } = req.body;

      // Validar campos requeridos
      if (!nombre_legal || !telefono) {
        return res.status(400).json({
          success: false,
          mensaje: 'Nombre completo y teléfono son requeridos',
        });
      }

      // Validar código MFA (RNF-001)
      if (!codigoMFA) {
        return res.status(400).json({
          success: false,
          mensaje: 'Código MFA requerido para actualizar información personal',
          requiresMFA: true,
        });
      }

      // Verificar código MFA
      const mfaValido = await mfaService.verifyTOTP(
        desarrolladorId,
        codigoMFA,
        'developer',
      );
      if (!mfaValido) {
        return res.status(401).json({
          success: false,
          mensaje: 'Código MFA inválido',
        });
      }

      // Actualizar información personal
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const resultado =
        await developerProfileService.actualizarInformacionPersonal(
          desarrolladorId,
          { nombre_legal, telefono },
          { ip_address: ipAddress, user_agent: userAgent },
        );

      res.status(200).json({
        success: true,
        mensaje: 'Información personal actualizada exitosamente',
        data: resultado,
      });
    } catch (error) {
      console.error('Error al actualizar información personal:', error);

      // Errores específicos de validación
      if (
        error.message.includes('5 días') ||
        error.message.includes('restricción')
      ) {
        return res.status(403).json({
          success: false,
          mensaje: error.message,
        });
      }

      res.status(500).json({
        success: false,
        mensaje: error.message || 'Error al actualizar información personal',
      });
    }
  },

  /**
   * Actualizar información bancaria (RF-003)
   * Requiere verificación MFA
   * Cifra datos sensibles con AES-256
   * Valida restricción de 5 días desde última modificación
   */
  async actualizarInformacionBancaria(req, res) {
    try {
      const desarrolladorId = req.user.id;
      const { banco, numero_cuenta, titular_cuenta, codigoMFA } = req.body;

      // Validar campos requeridos
      if (!banco || !numero_cuenta || !titular_cuenta) {
        return res.status(400).json({
          success: false,
          mensaje: 'Banco, número de cuenta y titular son requeridos',
        });
      }

      // Validar código MFA (RNF-001)
      if (!codigoMFA) {
        return res.status(400).json({
          success: false,
          mensaje: 'Código MFA requerido para actualizar información bancaria',
          requiresMFA: true,
        });
      }

      // Verificar código MFA
      const mfaValido = await mfaService.verifyTOTP(
        desarrolladorId,
        codigoMFA,
        'developer',
      );
      if (!mfaValido) {
        return res.status(401).json({
          success: false,
          mensaje: 'Código MFA inválido',
        });
      }

      // Actualizar información bancaria (con cifrado automático)
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const resultado =
        await developerProfileService.actualizarInformacionBancaria(
          desarrolladorId,
          { banco, numero_cuenta, titular_cuenta },
          { ip_address: ipAddress, user_agent: userAgent },
        );

      res.status(200).json({
        success: true,
        mensaje: 'Información bancaria actualizada exitosamente',
        data: resultado,
      });
    } catch (error) {
      console.error('Error al actualizar información bancaria:', error);

      // Errores específicos de validación
      if (
        error.message.includes('5 días') ||
        error.message.includes('restricción')
      ) {
        return res.status(403).json({
          success: false,
          mensaje: error.message,
        });
      }

      res.status(500).json({
        success: false,
        mensaje: error.message || 'Error al actualizar información bancaria',
      });
    }
  },
};
