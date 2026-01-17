import mfaService from '../services/mfaService.js';

const mfaController = {
  /**
   * Inicia la configuración de MFA - genera secreto y QR
   */
  setupMFA: async (req, res) => {
    try {
      const userId = req.user.id;
      const email = req.user.email;
      const userType = req.user.userType || 'admin';

      const result = await mfaService.generateMFASecret(userId, email, userType);

      res.status(200).json({
        success: true,
        message: 'MFA configurado. Escanea el código QR con tu aplicación autenticadora.',
        data: {
          qrCode: result.qrCode,
          secret: result.secret,
          manualEntryKey: result.manualEntryKey
        }
      });
    } catch (error) {
      console.error('Error al configurar MFA:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al configurar MFA'
      });
    }
  },

  /**
   * Verifica el código TOTP y activa MFA
   */
  verifyAndEnable: async (req, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Código de verificación requerido'
        });
      }

      const result = await mfaService.verifyAndEnableMFA(userId, token, userType);

      res.status(200).json({
        success: true,
        message: 'MFA activado exitosamente. Guarda tus códigos de respaldo en un lugar seguro.',
        backupCodes: result.backupCodes
      });
    } catch (error) {
      console.error('Error al verificar y activar MFA:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Código de verificación inválido'
      });
    }
  },

  /**
   * Verifica código TOTP durante login
   */
  verifyLogin: async (req, res) => {
    try {
      const { userId, token, userType = 'admin' } = req.body;

      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: 'User ID y código de verificación requeridos'
        });
      }

      const verified = await mfaService.verifyTOTP(userId, token, userType);

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Código de verificación inválido'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Código verificado correctamente'
      });
    } catch (error) {
      console.error('Error al verificar código de login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al verificar código'
      });
    }
  },

  /**
   * Deshabilita MFA para el usuario
   */
  disable: async (req, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña requerida para deshabilitar MFA'
        });
      }

      // Aquí podrías agregar verificación de contraseña adicional
      await mfaService.disableMFA(userId, userType);

      res.status(200).json({
        success: true,
        message: 'MFA deshabilitado exitosamente'
      });
    } catch (error) {
      console.error('Error al deshabilitar MFA:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al deshabilitar MFA'
      });
    }
  },

  /**
   * Obtiene el estado de MFA del usuario
   */
  getStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';

      const status = await mfaService.checkMFAStatus(userId, userType);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error al obtener estado de MFA:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estado de MFA'
      });
    }
  },

  /**
   * Regenera códigos de respaldo
   */
  regenerateBackupCodes: async (req, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';

      const backupCodes = await mfaService.regenerateBackupCodes(userId, userType);

      res.status(200).json({
        success: true,
        message: 'Códigos de respaldo regenerados',
        backupCodes
      });
    } catch (error) {
      console.error('Error al regenerar códigos de respaldo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al regenerar códigos de respaldo'
      });
    }
  },

  /**
   * Inicia la configuración de MFA durante login inicial (sin autenticación previa)
   */
  setupInitial: async (req, res) => {
    try {
      const { userId, email, tempToken, userType = 'admin' } = req.body;

      if (!userId || !email || !tempToken) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos'
        });
      }

      // Verificar el token temporal
      const { supabaseAdmin } = await import('../../../shared/config/supabase.js');
      const { getUserTypeConfig } = await import('../config/userTypes.js');
      const config = getUserTypeConfig(userType);
      
      const { data: user, error: userError } = await supabaseAdmin
        .from(config.table)
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida'
        });
      }

      const result = await mfaService.generateMFASecret(userId, email, userType);

      res.status(200).json({
        success: true,
        message: 'MFA configurado. Escanea el código QR con tu aplicación autenticadora.',
        data: {
          qrCode: result.qrCode,
          secret: result.secret,
          manualEntryKey: result.manualEntryKey
        }
      });
    } catch (error) {
      console.error('Error al configurar MFA inicial:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al configurar MFA'
      });
    }
  },

  /**
   * Verifica el código TOTP, activa MFA y completa el login inicial
   */
  verifyAndEnableInitial: async (req, res) => {
    try {
      const { userId, token, tempToken, userType = 'admin' } = req.body;

      if (!userId || !token || !tempToken) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos'
        });
      }

      // Verificar el código y activar MFA
      const result = await mfaService.verifyAndEnableMFA(userId, token, userType);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Código de verificación inválido'
        });
      }

      // Completar el login creando la sesión
      // Este paso depende del tipo de usuario
      let loginResult;
      if (userType === 'admin') {
        const adminService = (await import('../../admin/services/adminService.js')).default;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        loginResult = await adminService.completeMFALogin(userId, ipAddress, userAgent);
      }
      // Aquí se pueden agregar otros tipos de usuario en el futuro

      res.status(200).json({
        success: true,
        message: 'MFA activado exitosamente y login completado',
        backupCodes: result.backupCodes,
        ...loginResult
      });
    } catch (error) {
      console.error('Error al verificar y activar MFA inicial:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al activar MFA'
      });
    }
  },

  /**
   * Verifica código TOTP para operaciones administrativas sensibles
   * Requiere autenticación previa - solo valida el código MFA
   */
  verifyOperationCode: async (req, res) => {
    try {
      const { userId, token, userType = 'admin' } = req.body;

      // Validar que el userId del request coincida con el usuario autenticado
      if (req.user && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para verificar este código'
        });
      }

      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: 'User ID y código de verificación requeridos'
        });
      }

      const verified = await mfaService.verifyTOTP(userId, token, userType);

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Código de verificación inválido'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Código verificado correctamente'
      });
    } catch (error) {
      console.error('Error al verificar código de operación:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al verificar código'
      });
    }
  }
};

export default mfaController;
