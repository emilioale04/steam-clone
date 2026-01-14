import supabase, { supabaseAdmin } from '../../../shared/config/supabase.js';

export const authService = {
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        // Email confirmation redirect URL
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=true`
      }
    });
    
    if (error) throw error;

    // Check if email already exists - Supabase returns user with empty identities array
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      throw new Error('Este correo electrónico ya está registrado');
    }

    // Ensure we have a valid new user before creating profile
    if (!data.user || !data.user.id) {
      throw new Error('Error al crear el usuario');
    }

    // Create profile entry for the new user using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        username: userData.username || email.split('@')[0],
        balance: 0,
        is_limited: true,
        country_code: null,
        inventory_privacy: 'Public',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('[AUTH] Error creating profile:', profileError);
      // Clean up: delete the auth user since profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      } catch (cleanupError) {
        console.error('[AUTH] Error cleaning up user after profile failure:', cleanupError);
      }
      throw new Error('Error al crear el perfil de usuario. Por favor, intenta de nuevo.');
    }

    // Return data with email verification pending flag
    return {
      ...data,
      emailVerificationPending: true
    };
  },

  async signIn(email, password) {
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
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=true`
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async resetPasswordRequest(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    });
    
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword, accessToken, refreshToken) {
    // Establecer la sesión primero usando los tokens
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (sessionError) throw sessionError;
    }

    // Ahora actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  }
};
