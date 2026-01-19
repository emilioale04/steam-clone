import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';

const adminMiddleware = {
  /**
   * Verificar que el usuario es un administrador autenticado
   */
  verificarAdmin: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado',
        });
      }

      const token = authHeader.split(' ')[1];

      // Verificar token
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
        });
      }

      // Verificar que el usuario sea un administrador activo
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .eq('cuenta_activa', true)
        .single();

      if (adminError || !admin) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: No eres un administrador activo',
        });
      }

      // Verificar que la sesión esté activa en la base de datos
      const { data: session } = await supabaseAdmin
        .from('sesiones_admin')
        .select('*')
        .eq('access_token', token)
        .eq('activa', true)
        .single();

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida o cerrada',
        });
      }

      // Agregar información del admin al request
      req.admin = {
        id: user.id,
        email: user.email,
        rol: admin.rol,
        permisos: admin.permisos,
      };
      req.user = user;

      next();
    } catch (error) {
      console.error('Error en middleware de admin:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al verificar autenticación',
      });
    }
  },

  /**
   * Verificar permisos específicos del administrador
   */
  verificarPermiso: (permisoRequerido) => {
    return async (req, res, next) => {
      try {
        const { permisos } = req.admin;

        if (!permisos || !Array.isArray(permisos)) {
          return res.status(403).json({
            success: false,
            message: 'Sin permisos asignados',
          });
        }

        if (!permisos.includes(permisoRequerido) && !permisos.includes('*')) {
          return res.status(403).json({
            success: false,
            message: `Permiso denegado: Se requiere ${permisoRequerido}`,
          });
        }

        next();
      } catch (error) {
        console.error('Error al verificar permiso:', error);
        return res.status(500).json({
          success: false,
          message: 'Error al verificar permisos',
        });
      }
    };
  },
};

export default adminMiddleware;
