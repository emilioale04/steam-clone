/**
 * Servicio de Gestión de Perfil de Desarrolladores
 * Implementa lógica de negocio para actualización de información
 *
 * Cumple con:
 * - RF-003: Actualización de información personal/bancaria
 * - Política ABAC: Restricción de 5 días entre modificaciones
 * - RNF-003: Cifrado en reposo (AES-256)
 * - RNF-008: Auditoría de cambios
 * - C3: Sanitización de inputs
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';
import {
  sanitizeString,
  containsSQLInjection,
} from '../../../shared/utils/sanitization.js';
import {
  encryptBankData,
  decryptBankData,
} from '../../../shared/utils/encryption.js';
import {
  auditService,
  ACCIONES_AUDITORIA,
  RESULTADOS,
} from '../../../shared/services/auditService.js';

export const developerProfileService = {
  /**
   * Obtener perfil completo del desarrollador
   * Incluye información personal y bancaria (descifrada)
   */
  async obtenerPerfilCompleto(desarrolladorId) {
    try {
      // Obtener datos del desarrollador
      const { data: desarrollador, error } = await supabaseAdmin
        .from('desarrolladores')
        .select('*')
        .eq('id', desarrolladorId)
        .single();

      if (error || !desarrollador) {
        throw new Error('Desarrollador no encontrado');
      }

      // Descifrar datos bancarios (C2)
      const datosBancariosDescifrados = decryptBankData({
        cuenta_bancaria: desarrollador.numero_cuenta,
        titular_banco: desarrollador.titular_cuenta,
        nombre_banco: desarrollador.banco,
      });

      // Retornar perfil completo
      return {
        informacionPersonal: {
          nombre_legal: desarrollador.nombre_legal,
          email: desarrollador.email,
          telefono: desarrollador.telefono,
          pais: desarrollador.pais,
          direccion: desarrollador.direccion,
        },
        informacionBancaria: {
          banco: datosBancariosDescifrados.nombre_banco,
          numero_cuenta: datosBancariosDescifrados.cuenta_bancaria,
          titular_cuenta: datosBancariosDescifrados.titular_banco,
        },
        metadatos: {
          ultima_actualizacion_datos: desarrollador.ultima_actualizacion_datos,
          mfa_habilitado: desarrollador.mfa_habilitado,
        },
      };
    } catch (error) {
      console.error('Error al obtener perfil completo:', error);
      throw error;
    }
  },

  /**
   * Actualizar información personal (RF-003)
   * Valida restricción de 5 días desde última modificación
   */
  async actualizarInformacionPersonal(
    desarrolladorId,
    datos,
    requestMetadata = {},
  ) {
    const { nombre_legal, telefono } = datos;

    try {
      // === SANITIZACIÓN DE INPUTS (C3) ===
      const nombreSanitizado = sanitizeString(nombre_legal);
      const telefonoSanitizado = sanitizeString(telefono);

      // Detectar SQL injection
      if (
        containsSQLInjection(nombreSanitizado) ||
        containsSQLInjection(telefonoSanitizado)
      ) {
        await auditService.registrarEvento({
          desarrolladorId,
          accion: ACCIONES_AUDITORIA.MODIFICACION_PERFIL,
          resultado: RESULTADOS.FALLIDO,
          detalles: {
            razon: 'Entrada inválida detectada - posible SQL injection',
          },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });
        throw new Error('Entrada inválida detectada');
      }

      // === VALIDAR RESTRICCIÓN DE 5 DÍAS (Política ABAC - RF-003) ===
      const { data: desarrollador } = await supabaseAdmin
        .from('desarrolladores')
        .select('ultima_actualizacion_datos')
        .eq('id', desarrolladorId)
        .single();

      if (desarrollador?.ultima_actualizacion_datos) {
        const ultimaModificacion = new Date(
          desarrollador.ultima_actualizacion_datos,
        );
        const ahora = new Date();
        const diferenciaDias = Math.floor(
          (ahora - ultimaModificacion) / (1000 * 60 * 60 * 24),
        );

        if (diferenciaDias < 5) {
          const diasRestantes = 5 - diferenciaDias;

          // Registrar intento bloqueado
          await auditService.registrarEvento({
            desarrolladorId,
            accion: ACCIONES_AUDITORIA.MODIFICACION_PERFIL,
            resultado: RESULTADOS.FALLIDO,
            detalles: {
              razon: `Restricción de 5 días no cumplida (faltan ${diasRestantes} días)`,
              ultima_actualizacion_datos: ultimaModificacion.toISOString(),
            },
            ipAddress: requestMetadata.ip_address,
            userAgent: requestMetadata.user_agent,
          });

          throw new Error(
            `No puedes modificar tu perfil hasta dentro de ${diasRestantes} día(s). ` +
              `Última modificación: ${ultimaModificacion.toLocaleDateString('es-ES')}`,
          );
        }
      }

      // === ACTUALIZAR INFORMACIÓN PERSONAL ===
      const { data: actualizado, error } = await supabaseAdmin
        .from('desarrolladores')
        .update({
          nombre_legal: nombreSanitizado,
          telefono: telefonoSanitizado,
          ultima_actualizacion_datos: new Date().toISOString(),
        })
        .eq('id', desarrolladorId)
        .select('nombre_legal, telefono, ultima_actualizacion_datos')
        .single();

      if (error) {
        console.error('Error al actualizar información personal:', error);

        await auditService.registrarEvento({
          desarrolladorId,
          accion: ACCIONES_AUDITORIA.MODIFICACION_PERFIL,
          resultado: RESULTADOS.FALLIDO,
          detalles: { razon: error.message },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });

        throw new Error('Error al actualizar información personal');
      }

      // Registrar auditoría exitosa (RNF-008)
      await auditService.registrarEvento({
        desarrolladorId,
        accion: ACCIONES_AUDITORIA.MODIFICACION_PERFIL,
        resultado: RESULTADOS.EXITOSO,
        detalles: {
          campos_modificados: ['nombre_legal', 'telefono'],
          nuevo_nombre: nombreSanitizado,
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });

      return actualizado;
    } catch (error) {
      console.error('Error en actualizarInformacionPersonal:', error);
      throw error;
    }
  },

  /**
   * Actualizar información bancaria (RF-003)
   * Cifra datos sensibles con AES-256
   * Valida restricción de 5 días desde última modificación
   */
  async actualizarInformacionBancaria(
    desarrolladorId,
    datos,
    requestMetadata = {},
  ) {
    const { banco, numero_cuenta, titular_cuenta } = datos;

    try {
      // === SANITIZACIÓN DE INPUTS (C3) ===
      const bancoSanitizado = sanitizeString(banco);
      const numeroCuentaSanitizado = sanitizeString(numero_cuenta);
      const titularSanitizado = sanitizeString(titular_cuenta);

      // Detectar SQL injection
      if (
        containsSQLInjection(bancoSanitizado) ||
        containsSQLInjection(numeroCuentaSanitizado) ||
        containsSQLInjection(titularSanitizado)
      ) {
        await auditService.registrarEvento({
          desarrolladorId,
          accion: ACCIONES_AUDITORIA.MODIFICACION_BANCARIA,
          resultado: RESULTADOS.FALLIDO,
          detalles: {
            razon: 'Entrada inválida detectada - posible SQL injection',
          },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });
        throw new Error('Entrada inválida detectada');
      }

      // === VALIDAR RESTRICCIÓN DE 5 DÍAS (Política ABAC - RF-003) ===
      const { data: desarrollador } = await supabaseAdmin
        .from('desarrolladores')
        .select('ultima_actualizacion_datos')
        .eq('id', desarrolladorId)
        .single();

      if (desarrollador?.ultima_actualizacion_datos) {
        const ultimaModificacion = new Date(
          desarrollador.ultima_actualizacion_datos,
        );
        const ahora = new Date();
        const diferenciaDias = Math.floor(
          (ahora - ultimaModificacion) / (1000 * 60 * 60 * 24),
        );

        if (diferenciaDias < 5) {
          const diasRestantes = 5 - diferenciaDias;

          // Registrar intento bloqueado
          await auditService.registrarEvento({
            desarrolladorId,
            accion: ACCIONES_AUDITORIA.MODIFICACION_BANCARIA,
            resultado: RESULTADOS.FALLIDO,
            detalles: {
              razon: `Restricción de 5 días no cumplida (faltan ${diasRestantes} días)`,
              ultima_actualizacion_datos: ultimaModificacion.toISOString(),
            },
            ipAddress: requestMetadata.ip_address,
            userAgent: requestMetadata.user_agent,
          });

          throw new Error(
            `No puedes modificar tu información bancaria hasta dentro de ${diasRestantes} día(s). ` +
              `Última modificación: ${ultimaModificacion.toLocaleDateString('es-ES')}`,
          );
        }
      }

      // === CIFRAR DATOS BANCARIOS (C2: AES-256) ===
      const datosBancariosCifrados = encryptBankData({
        cuenta_bancaria: numeroCuentaSanitizado,
        titular_banco: titularSanitizado,
        nombre_banco: bancoSanitizado,
      });

      // === ACTUALIZAR INFORMACIÓN BANCARIA ===
      const { data: actualizado, error } = await supabaseAdmin
        .from('desarrolladores')
        .update({
          banco: datosBancariosCifrados.nombre_banco,
          numero_cuenta: datosBancariosCifrados.cuenta_bancaria, // Cifrado
          titular_cuenta: datosBancariosCifrados.titular_banco,
          ultima_actualizacion_datos: new Date().toISOString(),
        })
        .eq('id', desarrolladorId)
        .select('banco, ultima_actualizacion_datos')
        .single();

      if (error) {
        console.error('Error al actualizar información bancaria:', error);

        await auditService.registrarEvento({
          desarrolladorId,
          accion: ACCIONES_AUDITORIA.MODIFICACION_BANCARIA,
          resultado: RESULTADOS.FALLIDO,
          detalles: { razon: error.message },
          ipAddress: requestMetadata.ip_address,
          userAgent: requestMetadata.user_agent,
        });

        throw new Error('Error al actualizar información bancaria');
      }

      // Registrar auditoría exitosa (RNF-008)
      await auditService.registrarEvento({
        desarrolladorId,
        accion: ACCIONES_AUDITORIA.MODIFICACION_BANCARIA,
        resultado: RESULTADOS.EXITOSO,
        detalles: {
          campos_modificados: ['banco', 'numero_cuenta', 'titular_cuenta'],
          nuevo_banco: bancoSanitizado,
          // NO registrar números de cuenta completos por seguridad
          cuenta_enmascarada: '****' + numeroCuentaSanitizado.slice(-4),
        },
        ipAddress: requestMetadata.ip_address,
        userAgent: requestMetadata.user_agent,
      });

      return {
        banco: bancoSanitizado,
        ultima_actualizacion_datos: actualizado.ultima_actualizacion_datos,
      };
    } catch (error) {
      console.error('Error en actualizarInformacionBancaria:', error);
      throw error;
    }
  },
};
