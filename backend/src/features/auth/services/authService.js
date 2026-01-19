import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';

export const authService = {
  async signUp(email, password, userData = {}) {
    // signUp envía email de verificación automáticamente
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=true`
      }
    });
    
    if (error) {
      if (error.message.includes('already') || error.message.includes('exists')) {
        throw new Error('Este correo electrónico ya está registrado');
      }
      throw error;
    }

    if (!data.user || !data.user.id) {
      throw new Error('Error al crear el usuario');
    }

    // Crear perfil usando admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        username: userData.username || email.split('@')[0],
        balance: 0,
        is_limited: true,
        country_code: null,
        inventory_privacy: 'public',
        trade_privacy: 'public',
        marketplace_privacy: 'public',
        created_at: new Date().toISOString(),
        acepta_lopdp: true, 
        fecha_consentimiento: new Date().toISOString()
      });

    if (profileError) {
      console.error('[AUTH] Error creating profile:', profileError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      } catch (cleanupError) {
        console.error('[AUTH] Error cleaning up user:', cleanupError);
      }
      throw new Error('Error al crear el perfil de usuario. Por favor, intenta de nuevo.');
    }

    return {
      user: data.user,
      emailVerificationPending: true
    };
  },

  async signIn(email, password) {
    // signInWithPassword es stateless cuando persistSession: false
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;

    // Check if email is verified
    if (!data.user?.email_confirmed_at) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    return data;
  },

  async resendVerificationEmail(email) {
    // Usar admin para reenviar verificación
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=true`
      }
    });
    
    if (error) throw error;
    return data;
  },

  // signOut ya no necesita hacer nada en el servidor
  // porque no hay sesión persistida - solo el cliente borra su cookie
  async signOut() {
    // No-op: la sesión se maneja via cookies en el cliente
    // El backend simplemente invalida la cookie
    return;
  },

  // Esta función no se usa porque el middleware valida el token directamente
  // Mantenida por compatibilidad
  async getCurrentUser() {
    // NOTA: Esta función NO debe usarse en producción
    // El usuario se obtiene del token en el middleware
    console.warn('[AUTH] getCurrentUser called - should use token validation instead');
    return null;
  },

  async getSession() {
    // NOTA: No hay sesión persistida en el servidor
    console.warn('[AUTH] getSession called - sessions are managed via httpOnly cookies');
    return null;
  },

  async resetPasswordRequest(email) {
    // Usar admin para generar link de reset
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      }
    });
    
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword, accessToken, refreshToken) {
    // Verificar el token primero
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(accessToken);
    
    if (verifyError || !user) {
      throw new Error('Token inválido o expirado');
    }

    // Usar admin para actualizar la contraseña directamente
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) throw error;
    return data;
  }
};
