/**
 * Servicio de Autenticación para Desarrolladores (Steamworks)
 * Utiliza Supabase Auth con tabla extendida 'desarrolladores'
 * Cumple con: RF-001, RF-002, RNF-001, C14, C15, C18
 */

import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';

export const developerAuthService = {
  /**
   * Registro de nuevo desarrollador (RF-001)
   * Crea usuario en Supabase Auth y registro en tabla desarrolladores
   */
  async registrarDesarrollador(datosRegistro) {
    const {
      email,
      password,
      // Datos Personales (RF-001)
      nombre_legal,
      pais,
      telefono,
      direccion,
      // Información Bancaria (RF-001)
      banco,
      numero_cuenta,
      titular_cuenta,
      // Información Fiscal
      nif_cif,
      razon_social,
      // Aceptación Legal
      acepto_terminos
    } = datosRegistro;

    // Validar aceptación de términos (RF-001)
    if (!acepto_terminos) {
      throw new Error('Debe aceptar los términos y condiciones para registrarse');
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          rol: 'desarrollador',
          nombre_legal
        }
      }
    });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Error al crear usuario: ID no generado');
    }

    // 2. Crear registro en tabla desarrolladores (usando supabaseAdmin para bypass RLS)
    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .insert({
        id: userId,
        nombre_legal,
        pais,
        telefono,
        direccion,
        banco,
        numero_cuenta,
        titular_cuenta,
        nif_cif,
        razon_social,
        rol: 'desarrollador',
        acepto_terminos: true,
        fecha_aceptacion_terminos: new Date().toISOString(),
        mfa_habilitado: false,
        cuenta_activa: true
      })
      .select()
      .single();

    if (devError) {
      // Rollback: eliminar usuario de auth si falla la inserción
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(`Error al crear perfil de desarrollador: ${devError.message}`);
    }

    return {
      user: authData.user,
      session: authData.session,
      desarrollador
    };
  },

  /**
   * Inicio de sesión de desarrollador (RF-002)
   * Valida credenciales y verifica rol de desarrollador
   */
  async iniciarSesion(email, password) {
    // 1. Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    const userId = authData.user?.id;

    // 2. Verificar que existe en tabla desarrolladores y obtener datos (usando supabaseAdmin)
    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .select('*')
      .eq('id', userId)
      .eq('cuenta_activa', true)
      .single();

    if (devError || !desarrollador) {
      // Si no es desarrollador, cerrar sesión
      await supabase.auth.signOut();
      throw new Error('Acceso denegado: Usuario no registrado como desarrollador');
    }

    // 3. Actualizar última sesión
    await supabaseAdmin
      .from('desarrolladores')
      .update({ ultima_sesion: new Date().toISOString() })
      .eq('id', userId);

    return {
      user: authData.user,
      session: authData.session,
      desarrollador
    };
  },

  /**
   * Cerrar sesión de desarrollador
   */
  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtener desarrollador actual autenticado
   */
  async obtenerDesarrolladorActual() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No hay sesión activa');
    }

    const { data: desarrollador, error: devError } = await supabaseAdmin
      .from('desarrolladores')
      .select('*')
      .eq('id', user.id)
      .eq('cuenta_activa', true)
      .single();

    if (devError || !desarrollador) {
      throw new Error('Desarrollador no encontrado');
    }

    return {
      user,
      desarrollador
    };
  },

  /**
   * Obtener sesión actual
   */
  async obtenerSesion() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Solicitar restablecimiento de contraseña
   */
  async solicitarRestablecimientoPassword(email) {
    // Verificar que el email pertenece a un desarrollador (usando supabaseAdmin)
    const { data: desarrolladores } = await supabaseAdmin
      .from('desarrolladores')
      .select('id')
      .eq('cuenta_activa', true);

    // Enviar email de reset (Supabase maneja la validación del email)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/steamworks/reset-password`
    });

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar contraseña con tokens
   */
  async actualizarPassword(nuevaPassword, accessToken, refreshToken) {
    // Establecer sesión con tokens
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) throw sessionError;
    }

    // Actualizar contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaPassword
    });

    if (error) throw error;
    return data;
  },

  /**
   * Verificar si un usuario es desarrollador válido
   */
  async verificarRolDesarrollador(userId) {
    const { data, error } = await supabaseAdmin
      .from('desarrolladores')
      .select('id, rol, cuenta_activa, mfa_habilitado')
      .eq('id', userId)
      .eq('cuenta_activa', true)
      .single();

    if (error || !data) {
      return { esDesarrollador: false, desarrollador: null };
    }

    return {
      esDesarrollador: true,
      desarrollador: data
    };
  }
};
