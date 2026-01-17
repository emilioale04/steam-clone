import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { supabaseAdmin } from '../../../shared/config/supabase.js';
import { getUserTypeConfig } from '../config/userTypes.js';

const mfaService = {
  /**
   * Genera un secreto TOTP y un código QR para configurar MFA
   * @param {string} userId - ID del usuario
   * @param {string} email - Email del usuario
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  generateMFASecret: async (userId, email, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      // Generar secreto TOTP
      const secret = speakeasy.generateSecret({
        name: `${config.namePrefix} (${email})`,
        issuer: config.issuerName,
        length: 32
      });

      // Generar código QR
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Guardar el secreto temporalmente (sin activar aún)
      const { error } = await supabaseAdmin
        .from(config.table)
        .update({
          mfa_secret: secret.base32,
          mfa_habilitado: false, // No activar hasta verificar
          mfa_backup_codes: null
        })
        .eq('id', userId);

      if (error) {
        console.error('Error al guardar secreto MFA:', error);
        throw new Error('Error al configurar MFA');
      }

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      console.error('Error al generar secreto MFA:', error);
      throw error;
    }
  },

  /**
   * Verifica un código TOTP y activa MFA si es correcto
   * @param {string} userId - ID del usuario
   * @param {string} token - Código TOTP a verificar
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  verifyAndEnableMFA: async (userId, token, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      // Obtener el secreto del usuario
      const { data: user, error: userError } = await supabaseAdmin
        .from(config.table)
        .select('mfa_secret, mfa_habilitado')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error(`${config.displayName} no encontrado`);
      }

      if (!user.mfa_secret) {
        throw new Error('No hay secreto MFA configurado');
      }

      // Verificar el token TOTP
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: token,
        window: 2 // Permite 2 intervalos antes y después (60 segundos de margen)
      });

      if (!verified) {
        throw new Error('Código de verificación inválido');
      }

      // Generar códigos de respaldo
      const backupCodes = mfaService.generateBackupCodes();

      // Activar MFA
      const { error: updateError } = await supabaseAdmin
        .from(config.table)
        .update({
          mfa_habilitado: true,
          mfa_backup_codes: JSON.stringify(backupCodes)
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error al activar MFA:', updateError);
        throw new Error('Error al activar MFA');
      }

      return {
        success: true,
        backupCodes
      };
    } catch (error) {
      console.error('Error al verificar y activar MFA:', error);
      throw error;
    }
  },

  /**
   * Verifica un código TOTP para login
   * @param {string} userId - ID del usuario
   * @param {string} token - Código TOTP a verificar
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  verifyTOTP: async (userId, token, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      // Obtener el secreto del usuario
      const { data: user, error: userError } = await supabaseAdmin
        .from(config.table)
        .select('mfa_secret, mfa_habilitado, mfa_backup_codes')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error(`${config.displayName} no encontrado`);
      }

      if (!user.mfa_habilitado || !user.mfa_secret) {
        throw new Error('MFA no está habilitado');
      }

      // Verificar si es un código de respaldo
      if (user.mfa_backup_codes) {
        const backupCodes = JSON.parse(user.mfa_backup_codes);
        const codeIndex = backupCodes.findIndex(code => code === token);
        
        if (codeIndex !== -1) {
          // Código de respaldo válido, eliminarlo
          backupCodes.splice(codeIndex, 1);
          await supabaseAdmin
            .from(config.table)
            .update({
              mfa_backup_codes: JSON.stringify(backupCodes)
            })
            .eq('id', userId);
          
          return true;
        }
      }

      // Verificar el token TOTP
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      return verified;
    } catch (error) {
      console.error('Error al verificar TOTP:', error);
      throw error;
    }
  },

  /**
   * Deshabilita MFA para un usuario
   * @param {string} userId - ID del usuario
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  disableMFA: async (userId, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      const { error } = await supabaseAdmin
        .from(config.table)
        .update({
          mfa_secret: null,
          mfa_habilitado: false,
          mfa_backup_codes: null
        })
        .eq('id', userId);

      if (error) {
        console.error('Error al deshabilitar MFA:', error);
        throw new Error('Error al deshabilitar MFA');
      }

      return { success: true };
    } catch (error) {
      console.error('Error al deshabilitar MFA:', error);
      throw error;
    }
  },

  /**
   * Verifica si un usuario tiene MFA habilitado
   * @param {string} userId - ID del usuario
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  checkMFAStatus: async (userId, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      const { data: user, error } = await supabaseAdmin
        .from(config.table)
        .select('mfa_habilitado')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error('Error al verificar estado de MFA');
      }

      return {
        mfaEnabled: user?.mfa_habilitado || false
      };
    } catch (error) {
      console.error('Error al verificar estado de MFA:', error);
      throw error;
    }
  },

  /**
   * Genera códigos de respaldo
   */
  generateBackupCodes: () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generar código de 8 dígitos
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  },

  /**
   * Regenera códigos de respaldo
   * @param {string} userId - ID del usuario
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  regenerateBackupCodes: async (userId, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      const backupCodes = mfaService.generateBackupCodes();

      const { error } = await supabaseAdmin
        .from(config.table)
        .update({
          mfa_backup_codes: JSON.stringify(backupCodes)
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Error al regenerar códigos de respaldo');
      }

      return backupCodes;
    } catch (error) {
      console.error('Error al regenerar códigos de respaldo:', error);
      throw error;
    }
  }
};

export default mfaService;
