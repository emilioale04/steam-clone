/**
 * Servicio de MFA - Genérico para todos los módulos
 * Soporta admin, developer, y user con configuración flexible
 */

import { getUserTypeConfig } from '../config/userTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const mfaService = {
  /**
   * Iniciar configuración de MFA durante login inicial (sin token de sesión)
   * @param {string} userId - ID del usuario
   * @param {string} email - Email del usuario
   * @param {string} tempToken - Token temporal de login
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  setupInitial: async (userId, email, tempToken, userType = 'admin') => {
    try {
      const response = await fetch(`${API_URL}/mfa/setup-initial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, email, tempToken, userType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al configurar MFA');
      }

      return data;
    } catch (error) {
      console.error('Error al configurar MFA inicial:', error);
      throw error;
    }
  },

  /**
   * Verificar código TOTP, activar MFA y completar login inicial
   * @param {string} userId - ID del usuario
   * @param {string} totpCode - Código TOTP a verificar
   * @param {string} tempToken - Token temporal de login
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  verifyAndEnableInitial: async (userId, totpCode, tempToken, userType = 'admin') => {
    try {
      const response = await fetch(`${API_URL}/mfa/verify-enable-initial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, token: totpCode, tempToken, userType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      return data;
    } catch (error) {
      console.error('Error al verificar y activar MFA inicial:', error);
      throw error;
    }
  },

  /**
   * Iniciar configuración de MFA - obtener QR y secreto
   */
  setupMFA: async (token) => {
    try {
      const response = await fetch(`${API_URL}/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al configurar MFA');
      }

      return data;
    } catch (error) {
      console.error('Error al configurar MFA:', error);
      throw error;
    }
  },

  /**
   * Verificar código TOTP y activar MFA
   */
  verifyAndEnable: async (token, totpCode) => {
    try {
      const response = await fetch(`${API_URL}/mfa/verify-enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: totpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      return data;
    } catch (error) {
      console.error('Error al verificar y activar MFA:', error);
      throw error;
    }
  },

  /**
   * Verificar código TOTP durante login
   * @param {string} userId - ID del usuario
   * @param {string} totpCode - Código TOTP a verificar
   * @param {string} userType - Tipo de usuario (admin, developer, user)
   */
  verifyLoginCode: async (userId, totpCode, userType = 'admin') => {
    try {
      const config = getUserTypeConfig(userType);
      
      const response = await fetch(`${API_URL}${config.apiEndpoint}/verify-mfa-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          token: totpCode,
          userType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      return data;
    } catch (error) {
      console.error('Error al verificar código de login:', error);
      throw error;
    }
  },

  /**
   * Obtener estado de MFA
   */
  getMFAStatus: async (token) => {
    try {
      const response = await fetch(`${API_URL}/mfa/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener estado de MFA');
      }

      return data;
    } catch (error) {
      console.error('Error al obtener estado de MFA:', error);
      throw error;
    }
  },

  /**
   * Deshabilitar MFA
   */
  disableMFA: async (token, password) => {
    try {
      const response = await fetch(`${API_URL}/mfa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al deshabilitar MFA');
      }

      return data;
    } catch (error) {
      console.error('Error al deshabilitar MFA:', error);
      throw error;
    }
  },

  /**
   * Regenerar códigos de respaldo
   */
  regenerateBackupCodes: async (token) => {
    try {
      const response = await fetch(`${API_URL}/mfa/regenerate-backup-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al regenerar códigos');
      }

      return data;
    } catch (error) {
      console.error('Error al regenerar códigos de respaldo:', error);
      throw error;
    }
  }
};

export default mfaService;
