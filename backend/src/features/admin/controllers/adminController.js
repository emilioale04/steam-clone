import adminService from '../services/adminService.js';
import mfaService from '../../mfa/services/mfaService.js';

const adminController = {
  /**
   * Login de administrador
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos',
        });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await adminService.login(email, password, ipAddress, userAgent);

      // Si requiere MFA, no devolver token aún
      if (result.requiresMFA) {
        return res.status(200).json({
          success: true,
          requiresMFA: true,
          adminId: result.adminId,
          email: result.email,
          message: 'Ingresa tu código de autenticación de dos factores',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        ...result,
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al iniciar sesión',
      });
    }
  },

  /**
   * Verificar MFA y completar login
   */
  verifyMFALogin: async (req, res) => {
    try {
      const userId = req.body.userId || req.body.adminId;
      const { token, userType = 'admin' } = req.body;

      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario y código de verificación requeridos',
        });
      }

      // Verificar el código TOTP
      const verified = await mfaService.verifyTOTP(userId, token, userType);

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Código de verificación inválido',
        });
      }

      // Completar el login
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const result = await adminService.completeMFALogin(userId, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        ...result,
      });
    } catch (error) {
      console.error('Error al verificar MFA:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al verificar código',
      });
    }
  },

  /**
   * Logout de administrador
   */
  logout: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token no proporcionado',
        });
      }

      const adminId = req.admin?.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await adminService.logout(token, adminId, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Logout exitoso',
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
      });
    }
  },

  /**
   * Validar sesión de administrador
   */
  validateSession: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token no proporcionado',
        });
      }

      const result = await adminService.validateSession(token);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error en validación:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Sesión inválida',
      });
    }
  },

  /**
   * Obtener audit logs
   */
  getAuditLogs: async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const result = await adminService.getAuditLogs(parseInt(limit), parseInt(offset));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de auditoría',
      });
    }
  },

  /**
   * Obtener bloqueos de países (RA-001)
   */
  getBloqueoPaises: async (req, res) => {
    try {
      const result = await adminService.getBloqueoPaises();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener bloqueos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener bloqueos de países',
      });
    }
  },

  /**
   * Crear bloqueo de país (RA-001)
   */
  createBloqueoPais: async (req, res) => {
    try {
      const { codigo_pais, estado, motivo_politico } = req.body;
      const adminId = req.admin.id;

      const result = await adminService.createBloqueoPais(
        codigo_pais,
        estado,
        motivo_politico,
        adminId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al crear bloqueo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear bloqueo de país',
      });
    }
  },

  /**
   * Actualizar bloqueo de país (RA-001)
   */
  updateBloqueoPais: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, motivo_politico } = req.body;
      const adminId = req.admin.id;

      const result = await adminService.updateBloqueoPais(
        id,
        estado,
        motivo_politico,
        adminId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al actualizar bloqueo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar bloqueo de país',
      });
    }
  },

  /**
   * Eliminar bloqueo de país (RA-001)
   */
  deleteBloqueoPais: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      await adminService.deleteBloqueoPais(id, adminId, req.ip, req.headers['user-agent']);

      res.status(200).json({
        success: true,
        message: 'Bloqueo eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar bloqueo de país',
      });
    }
  },

  /**
   * Obtener revisiones de juegos (RA-002)
   */
  getRevisionesJuegos: async (req, res) => {
    try {
      const { estado } = req.query;
      const result = await adminService.getRevisionesJuegos(estado);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener revisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener revisiones de juegos',
      });
    }
  },

  /**
   * Aprobar juego (RA-002, RA-004)
   */
  aprobarJuego: async (req, res) => {
    try {
      const { id } = req.params;
      const { comentarios } = req.body;
      const adminId = req.admin.id;

      const result = await adminService.aprobarJuego(
        id,
        adminId,
        comentarios,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Juego aprobado exitosamente',
      });
    } catch (error) {
      console.error('Error al aprobar juego:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aprobar juego',
      });
    }
  },

  /**
   * Rechazar juego (RA-002, RA-004)
   */
  rechazarJuego: async (req, res) => {
    try {
      const { id } = req.params;
      const { comentarios } = req.body;
      const adminId = req.admin.id;

      if (!comentarios) {
        return res.status(400).json({
          success: false,
          message: 'Los comentarios son obligatorios al rechazar un juego',
        });
      }

      const result = await adminService.rechazarJuego(
        id,
        adminId,
        comentarios,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Juego rechazado',
      });
    } catch (error) {
      console.error('Error al rechazar juego:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar juego',
      });
    }
  },

  /**
   * Obtener sanciones (RA-003)
   */
  getSanciones: async (req, res) => {
    try {
      const { activa, usuario_id } = req.query;
      const result = await adminService.getSanciones(activa, usuario_id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener sanciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sanciones',
      });
    }
  },

  /**
   * Crear sanción (RA-003)
   */
  crearSancion: async (req, res) => {
    try {
      const { username, motivo, fecha_fin } = req.body;
      const adminId = req.admin.id;

      if (!username || !motivo) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos',
        });
      }

      const result = await adminService.crearSancion(
        username,
        adminId,
        motivo,
        fecha_fin,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Ban temporal aplicado exitosamente',
      });
    } catch (error) {
      console.error('Error al crear sanción:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear sanción',
      });
    }
  },

  /**
   * Desactivar sanción (RA-003)
   */
  desactivarSancion: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      const result = await adminService.desactivarSancion(
        id,
        adminId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Sanción desactivada',
      });
    } catch (error) {
      console.error('Error al desactivar sanción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar sanción',
      });
    }
  },

  /**
   * Obtener categorías (RA-005)
   */
  getCategorias: async (req, res) => {
    try {
      const result = await adminService.getCategorias();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías',
      });
    }
  },

  /**
   * Crear categoría (RA-005)
   */
  crearCategoria: async (req, res) => {
    try {
      const { nombre_categoria, descripcion } = req.body;
      const adminId = req.admin.id;

      if (!nombre_categoria) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido',
        });
      }

      const result = await adminService.crearCategoria(
        nombre_categoria,
        descripcion,
        adminId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear categoría',
      });
    }
  },

  /**
   * Actualizar categoría (RA-005)
   */
  updateCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_categoria, descripcion, activa } = req.body;
      const adminId = req.admin.id;

      const result = await adminService.updateCategoria(
        id,
        nombre_categoria,
        descripcion,
        activa,
        adminId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
      });
    }
  },

  /**
   * Eliminar categoría (RA-005)
   */
  deleteCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      await adminService.deleteCategoria(id, adminId, req.ip, req.headers['user-agent']);

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada',
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar categoría',
      });
    }
  },

  /**
   * Obtener reportes de ban
   */
  getReportesBan: async (req, res) => {
    try {
      const { estado } = req.query;
      const result = await adminService.getReportesBan(estado);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error al obtener reportes de ban:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reportes de ban',
      });
    }
  },

  /**
   * Aprobar reporte de ban
   */
  aprobarReporteBan: async (req, res) => {
    try {
      const { id } = req.params;
      const { comentarios, duracion_minutos } = req.body;
      const adminId = req.admin.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await adminService.aprobarReporteBan(
        id,
        adminId,
        comentarios,
        duracion_minutos,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: 'Reporte aprobado y sanción aplicada',
        data: result,
      });
    } catch (error) {
      console.error('Error al aprobar reporte de ban:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al aprobar reporte de ban',
      });
    }
  },

  /**
   * Rechazar reporte de ban
   */
  rechazarReporteBan: async (req, res) => {
    try {
      const { id } = req.params;
      const { comentarios } = req.body;
      const adminId = req.admin.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await adminService.rechazarReporteBan(
        id,
        adminId,
        comentarios,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: 'Reporte rechazado',
        data: result,
      });
    } catch (error) {
      console.error('Error al rechazar reporte de ban:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar reporte de ban',
      });
    }
  },
};

export default adminController;
