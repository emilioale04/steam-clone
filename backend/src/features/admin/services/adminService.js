import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';
import { notificationService } from '../../../shared/services/notificationService.js';
import { emailService } from '../../../shared/services/emailService.js';

const adminService = {
  /**
   * Login de administrador
   */
  login: async (email, password, ipAddress, userAgent) => {
    try {
      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Error de autenticación:', authError);
        throw new Error('Credenciales inválidas');
      }

      const userId = authData.user.id;
      const accessToken = authData.session.access_token;
      const refreshToken = authData.session.refresh_token;

      // Verificar que el usuario es un administrador activo
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', userId)
        .eq('cuenta_activa', true)
        .single();

      if (adminError || !admin) {
        // Cerrar sesión de Supabase si no es admin
        await supabase.auth.signOut();
        console.error('Error al consultar admin:', adminError);
        throw new Error('Acceso denegado: No eres un administrador activo');
      }

      // Verificar si tiene MFA habilitado
      if (admin.mfa_habilitado) {
        // Si tiene MFA, no crear sesión aún, devolver que necesita MFA
        return {
          requiresMFA: true,
          adminId: userId,
          email: authData.user.email,
          tempToken: accessToken // Token temporal para verificar MFA
        };
      }

      // Si no tiene MFA, requiere configurarlo (obligatorio)
      return {
        requiresSetupMFA: true,
        adminId: userId,
        email: authData.user.email,
        tempToken: accessToken // Token temporal para configurar MFA
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Completar login después de verificar MFA
   */
  completeMFALogin: async (adminId, ipAddress, userAgent) => {
    try {
      // Obtener datos del admin
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .eq('cuenta_activa', true)
        .single();

      if (adminError || !admin) {
        throw new Error('Administrador no encontrado');
      }

      // Obtener el token actual de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No se pudo obtener la sesión');
      }

      const accessToken = session.access_token;
      const refreshToken = session.refresh_token;

      // Crear registro de sesión en la base de datos para auditoría
      const { error: sessionInsertError } = await supabaseAdmin
        .from('sesiones_admin')
        .insert({
          admin_id: adminId,
          access_token: accessToken,
          ip_address: ipAddress,
          user_agent: userAgent,
          activa: true,
        });

      if (sessionInsertError) {
        console.error('Error al crear registro de sesión:', sessionInsertError);
      }

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'login_mfa_verificado',
        'sesion_admin',
        { email: admin.email },
        ipAddress,
        userAgent,
        'exito'
      );

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: adminId,
          email: admin.email,
          rol: admin.rol,
          permisos: admin.permisos,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout de administrador
   */
  logout: async (token, adminId, ipAddress, userAgent) => {
    try {
      // Cerrar sesión en Supabase
      // Usamos supabaseAdmin para hacer signOut con el token específico
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(token);
      
      if (signOutError) {
        console.error('Error al cerrar sesión en Supabase:', signOutError);
      }

      // Marcar sesión como inactiva en la base de datos
      await supabaseAdmin
        .from('sesiones_admin')
        .update({
          activa: false,
          fecha_cierre: new Date().toISOString(),
        })
        .eq('access_token', token)
        .eq('admin_id', adminId);

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'logout',
        'sesion_admin',
        {},
        ipAddress,
        userAgent,
        'exito'
      );

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      throw new Error('Error al cerrar sesión');
    }
  },

  /**
   * Validar sesión de administrador
   */
  validateSession: async (token) => {
    try {
      // Verificar token con Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Token inválido o expirado');
      }

      // Verificar que el usuario sea un administrador activo
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .eq('cuenta_activa', true)
        .single();

      if (adminError || !admin) {
        throw new Error('Administrador no activo');
      }

      // Verificar que la sesión esté activa en la base de datos
      const { data: session } = await supabaseAdmin
        .from('sesiones_admin')
        .select('*')
        .eq('access_token', token)
        .eq('activa', true)
        .single();

      if (!session) {
        throw new Error('Sesión inválida o cerrada');
      }

      return {
        valid: true,
        admin: {
          id: user.id,
          email: user.email,
          rol: admin.rol,
          permisos: admin.permisos,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Registrar en audit log
   */
  registrarAuditLog: async (adminId, accion, recurso, detalles, ipAddress, userAgent, resultado) => {
    try {
      await supabaseAdmin.from('audit_logs_admin').insert({
        admin_id: adminId,
        accion,
        recurso,
        detalles,
        ip_address: ipAddress,
        user_agent: userAgent,
        resultado,
      });
    } catch (error) {
      console.error('Error al registrar audit log:', error);
    }
  },

  /**
   * Limpiar sesiones expiradas
   */
  limpiarSesionesExpiradas: async () => {
    try {
      const { error } = await supabaseAdmin.rpc('limpiar_sesiones_admin_expiradas');
      
      if (error) {
        console.error('Error al limpiar sesiones:', error);
      }
    } catch (error) {
      console.error('Error al limpiar sesiones expiradas:', error);
    }
  },

  /**
   * Obtener audit logs (RNF-004)
   */
  getAuditLogs: async (limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener audit logs:', error);
      throw error;
    }
  },

  /**
   * Obtener logs de admin
   */
  getLogsAdmin: async (limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs_admin')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener logs de admin:', error);
      throw error;
    }
  },

  /**
   * Obtener logs de desarrolladores
   */
  getLogsDesarrolladores: async (limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('logs_auditoria_desarrolladores')
        .select('*')
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener logs de desarrolladores:', error);
      throw error;
    }
  },

  /**
   * Obtener logs de comunidad
   */
  getLogsComunidad: async (limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('logs_comunidad')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener logs de comunidad:', error);
      throw error;
    }
  },

  /**
   * Obtener bloqueos de países (RA-001)
   */
  getBloqueoPaises: async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('bloqueos_paises')
        .select('*')
        .is('deleted_at', null)
        .order('codigo_pais');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener bloqueos:', error);
      throw error;
    }
  },

  /**
   * Crear bloqueo de país (RA-001)
   */
  createBloqueoPais: async (codigo_pais, estado, motivo_politico, adminId, ipAddress, userAgent) => {
    try {
      // Verificar si ya existe un registro activo
      const { data: existing } = await supabaseAdmin
        .from('bloqueos_paises')
        .select('id')
        .eq('codigo_pais', codigo_pais)
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new Error('Ya existe un registro para este país');
      }

      // Verificar si existe un registro eliminado (soft deleted)
      const { data: deletedRecord } = await supabaseAdmin
        .from('bloqueos_paises')
        .select('id')
        .eq('codigo_pais', codigo_pais)
        .not('deleted_at', 'is', null)
        .single();

      let data;
      let error;

      if (deletedRecord) {
        // Reutilizar el registro eliminado
        const result = await supabaseAdmin
          .from('bloqueos_paises')
          .update({
            estado,
            motivo_politico,
            id_administrador: adminId,
            deleted_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedRecord.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Crear nuevo registro
        const result = await supabaseAdmin
          .from('bloqueos_paises')
          .insert({
            codigo_pais,
            estado,
            motivo_politico,
            id_administrador: adminId,
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'crear_bloqueo_pais',
        'bloqueos_paises',
        { codigo_pais, estado },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al crear bloqueo:', error);
      throw error;
    }
  },

  /**
   * Actualizar bloqueo de país (RA-001)
   */
  updateBloqueoPais: async (id, estado, motivo_politico, adminId, ipAddress, userAgent) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('bloqueos_paises')
        .update({
          estado,
          motivo_politico,
          id_administrador: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'actualizar_bloqueo_pais',
        'bloqueos_paises',
        { id, estado },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al actualizar bloqueo:', error);
      throw error;
    }
  },

  /**
   * Eliminar bloqueo de país (RA-001)
   */
  deleteBloqueoPais: async (id, adminId, ipAddress, userAgent) => {
    try {
      const { error } = await supabaseAdmin
        .from('bloqueos_paises')
        .update({ 
          estado: 'permitido',
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'eliminar_bloqueo_pais',
        'bloqueos_paises',
        { id },
        ipAddress,
        userAgent,
        'exito'
      );
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      throw error;
    }
  },

  /**
   * Obtener revisiones de juegos (RA-002)
   */
  getRevisionesJuegos: async (estado = null) => {
    try {
      let query = supabaseAdmin
        .from('revisiones_juegos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (estado) {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener revisiones:', error);
      throw error;
    }
  },

  /**
   * Obtener información de un juego para revisión
   */
  getInfoJuegoRevision: async (idJuego) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('*')
        .eq('id', idJuego)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener información del juego:', error);
      throw error;
    }
  },

  /**
   * Aprobar juego (RA-002, RA-004)
   */
  aprobarJuego: async (id, adminId, comentarios, ipAddress, userAgent) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('revisiones_juegos')
        .update({
          estado: 'aprobado', 
          comentarios_retroalimentacion: comentarios,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Obtener información del juego y desarrollador
      const { data: game, error: gameError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('id, nombre_juego, desarrollador_id')
        .eq('id', data.id_juego)
        .single();

      let notificationResult = { success: false, sent: false };
      
      if (!gameError && game && game.desarrollador_id) {
        // Enviar notificación WebSocket al desarrollador
        try {
          notificationResult = await notificationService.notifyGameApproval(
            game.desarrollador_id,
            game.id,
            game.nombre_juego,
            comentarios
          );
        } catch (wsError) {
          // Error silencioso
        }

        // Enviar email al desarrollador (asíncrono - no bloquea)
        emailService.sendGameApprovalEmail(
          game.desarrollador_id,
          game.nombre_juego,
          comentarios
        ).catch(() => {});
      }

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'aprobar_juego',
        'revisiones_juegos',
        { 
          id_revision: id, 
          id_juego: data.id_juego, 
          notificacion_enviada: notificationResult.sent,
          email_enviado: 'async'
        },
        ipAddress,
        userAgent,
        'exito'
      );

      return { 
        ...data, 
        notificationSent: notificationResult.sent,
        notificationSaved: notificationResult.success,
        emailSent: 'pending'
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Rechazar juego (RA-002, RA-004)
   */
  rechazarJuego: async (id, adminId, comentarios, ipAddress, userAgent) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('revisiones_juegos')
        .update({
          estado: 'rechazado',
          comentarios_retroalimentacion: comentarios,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Obtener información del juego y desarrollador
      const { data: game, error: gameError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('id, nombre_juego, desarrollador_id')
        .eq('id', data.id_juego)
        .single();

      if (!gameError && game && game.desarrollador_id) {
        // Enviar email de rechazo al desarrollador (asíncrono - no bloquea)
        emailService.sendGameRejectionEmail(
          game.desarrollador_id,
          game.nombre_juego,
          comentarios
        ).catch(() => {});
      }

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'rechazar_juego',
        'revisiones_juegos',
        { 
          id_revision: id, 
          id_juego: data.id_juego,
          email_enviado: 'async' // Email se envía en background
        },
        ipAddress,
        userAgent,
        'exito'
      );

      return { 
        ...data,
        emailSent: 'pending' // Email se envía en background
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verificar y desactivar sanciones expiradas
   */
  verificarSancionesExpiradas: async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('sanciones_globales')
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq('activa', true)
        .not('fecha_fin', 'is', null)
        .lt('fecha_fin', new Date().toISOString())
        .select();

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error al verificar sanciones expiradas:', error);
      return [];
    }
  },

  /**
   * Obtener sanciones (RA-003)
   */
  getSanciones: async (activa = null, usuario_id = null) => {
    try {
      // Verificar y desactivar sanciones expiradas primero
      await adminService.verificarSancionesExpiradas();

      let query = supabaseAdmin
        .from('sanciones_globales')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (activa !== null) {
        query = query.eq('activa', activa === 'true');
      }

      if (usuario_id) {
        query = query.eq('id_usuario_sancionado', usuario_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Obtener usernames de los usuarios sancionados
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.id_usuario_sancionado))];
        
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (!profilesError && profiles) {
          const profilesMap = {};
          profiles.forEach(p => {
            profilesMap[p.id] = p.username;
          });

          // Añadir username a cada sanción
          const sanciones = data.map(sancion => ({
            ...sancion,
            username: profilesMap[sancion.id_usuario_sancionado] || 'Usuario desconocido'
          }));

          return sanciones;
        }
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener sanciones:', error);
      throw error;
    }
  },

  /**
   * Crear sanción (RA-003)
   */
  crearSancion: async (username, adminId, motivo, fecha_fin, ipAddress, userAgent) => {
    try {
      // Buscar el usuario por username
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuario no encontrado');
      }

      // Si no se proporciona fecha_fin, por defecto es 1 minuto desde ahora
      let fechaFinFinal = fecha_fin;
      if (!fecha_fin) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        fechaFinFinal = now.toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('sanciones_globales')
        .insert({
          id_usuario_sancionado: profile.id,
          id_administrador: adminId,
          tipo_sancion: 'ban_temporal',
          motivo,
          fecha_fin: fechaFinFinal,
          activa: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'crear_sancion',
        'sanciones_globales',
        { username, tipo_sancion: 'ban_temporal' },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al crear sanción:', error);
      throw error;
    }
  },

  /**
   * Desactivar sanción (RA-003)
   */
  desactivarSancion: async (id, adminId, ipAddress, userAgent) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('sanciones_globales')
        .update({
          activa: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'desactivar_sancion',
        'sanciones_globales',
        { id_sancion: id },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al desactivar sanción:', error);
      throw error;
    }
  },

  /**
   * Obtener categorías (RA-005)
   */
  getCategorias: async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('categorias_contenido')
        .select('*')
        .is('deleted_at', null)
        .order('nombre_categoria');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },

  /**
   * Crear categoría (RA-005)
   */
  crearCategoria: async (nombre_categoria, descripcion, adminId, ipAddress, userAgent) => {
    try {
      // Verificar si ya existe
      const { data: existing } = await supabaseAdmin
        .from('categorias_contenido')
        .select('id')
        .eq('nombre_categoria', nombre_categoria)
        .is('deleted_at', null)
        .single();

      if (existing) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      const { data, error } = await supabaseAdmin
        .from('categorias_contenido')
        .insert({
          nombre_categoria,
          descripcion,
          activa: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'crear_categoria',
        'categorias_contenido',
        { nombre_categoria },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },

  /**
   * Actualizar categoría (RA-005)
   */
  updateCategoria: async (id, nombre_categoria, descripcion, activa, adminId, ipAddress, userAgent) => {
    try {
      const updateData = { updated_at: new Date().toISOString() };
      
      if (nombre_categoria !== undefined) updateData.nombre_categoria = nombre_categoria;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (activa !== undefined) updateData.activa = activa;

      const { data, error } = await supabaseAdmin
        .from('categorias_contenido')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'actualizar_categoria',
        'categorias_contenido',
        { id, cambios: updateData },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  },

  /**
   * Eliminar categoría (RA-005)
   */
  deleteCategoria: async (id, adminId, ipAddress, userAgent) => {
    try {
      const { error } = await supabaseAdmin
        .from('categorias_contenido')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'eliminar_categoria',
        'categorias_contenido',
        { id },
        ipAddress,
        userAgent,
        'exito'
      );
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  },

  /**
   * Obtener reportes de ban pendientes
   */
  getReportesBan: async (estado = null) => {
    try {
      let query = supabaseAdmin
        .from('reportes_comunidad')
        .select('*')
        .eq('tipo_objetivo', 'usuario')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (estado) {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Obtener información de usuarios reportados y reportantes
      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(r => r.id_reportante),
          ...data.map(r => r.id_objetivo)
        ])];
        
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (!profilesError && profiles) {
          const profilesMap = {};
          profiles.forEach(p => {
            profilesMap[p.id] = p.username;
          });

          const reportesConInfo = data.map(reporte => ({
            ...reporte,
            username_reportante: profilesMap[reporte.id_reportante] || 'Desconocido',
            username_reportado: profilesMap[reporte.id_objetivo] || 'Desconocido'
          }));

          return reportesConInfo;
        }
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener reportes de ban:', error);
      throw error;
    }
  },

  /**
   * Aprobar reporte de ban (crear sanción)
   */
  aprobarReporteBan: async (reporteId, adminId, comentarios, duracion_minutos, ipAddress, userAgent) => {
    try {
      // Obtener el reporte
      const { data: reporte, error: reporteError } = await supabaseAdmin
        .from('reportes_comunidad')
        .select('*')
        .eq('id', reporteId)
        .single();

      if (reporteError || !reporte) {
        throw new Error('Reporte no encontrado');
      }

      // Calcular fecha de fin del ban (por defecto 1 minuto)
      const fecha_fin = new Date();
      fecha_fin.setMinutes(fecha_fin.getMinutes() + (duracion_minutos || 1));

      // Crear sanción
      const { data: sancion, error: sancionError } = await supabaseAdmin
        .from('sanciones_globales')
        .insert({
          id_usuario_sancionado: reporte.id_objetivo,
          id_administrador: adminId,
          tipo_sancion: 'ban_temporal',
          motivo: `Reporte aprobado: ${reporte.motivo}${comentarios ? ' - ' + comentarios : ''}`,
          fecha_fin: fecha_fin.toISOString(),
          activa: true,
        })
        .select()
        .single();

      if (sancionError) throw sancionError;

      // Actualizar el reporte
      const { error: updateError } = await supabaseAdmin
        .from('reportes_comunidad')
        .update({
          estado: 'resuelto',
          id_administrador_revisor: adminId,
          notas_admin: comentarios,
          updated_at: new Date().toISOString()
        })
        .eq('id', reporteId);

      if (updateError) throw updateError;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'aprobar_reporte_ban',
        'reportes_comunidad',
        { reporte_id: reporteId, sancion_id: sancion.id },
        ipAddress,
        userAgent,
        'exito'
      );

      return sancion;
    } catch (error) {
      console.error('Error al aprobar reporte de ban:', error);
      throw error;
    }
  },

  /**
   * Rechazar reporte de ban
   */
  rechazarReporteBan: async (reporteId, adminId, comentarios, ipAddress, userAgent) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('reportes_comunidad')
        .update({
          estado: 'rechazado',
          id_administrador_revisor: adminId,
          notas_admin: comentarios,
          updated_at: new Date().toISOString()
        })
        .eq('id', reporteId)
        .select()
        .single();

      if (error) throw error;

      // Registrar en audit log
      await adminService.registrarAuditLog(
        adminId,
        'rechazar_reporte_ban',
        'reportes_comunidad',
        { reporte_id: reporteId },
        ipAddress,
        userAgent,
        'exito'
      );

      return data;
    } catch (error) {
      console.error('Error al rechazar reporte de ban:', error);
      throw error;
    }
  },
};

export default adminService;
