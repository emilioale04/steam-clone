import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Configuración rápida del cliente (Asegúrate de tener esto en tu .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usa la Service Role para poder editar perfiles

// Fail fast when env vars are missing to avoid Supabase client errors
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {

  // --- REGISTRO (Usa Argon2 de Supabase) ---
  async signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } } // Guardamos username en metadata
    });

    if (error) throw new Error(error.message);

    // Crear perfil inicial para controlar seguridad
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username,
          email: email,
          login_attempts: 0,
          mfa_enabled: false
        });
      
      if (profileError) console.error("Error creando perfil:", profileError);
    }

    return data;
  },

  // --- LOGIN (Tu lógica de Bloqueo + Login de Supabase) ---
  async signIn(email, password) {
    // 1. BUSCAR PERFIL (Para ver si está bloqueado)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    // ⛔ REGLA DE ANGEL: Verificar Bloqueo
    if (profile?.lock_until && new Date(profile.lock_until) > new Date()) {
      const remaining = Math.ceil((new Date(profile.lock_until) - new Date()) / 60000);
      throw new Error(`Cuenta bloqueada. Intenta en ${remaining} minutos.`);
    }

    // 2. INTENTAR LOGIN (Supabase verifica el Hash Argon2)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // 3. SI FALLA: AUMENTAR CONTADOR
    if (error) {
      if (profile) {
        const newAttempts = (profile.login_attempts || 0) + 1;
        let updateData = { login_attempts: newAttempts };

        // Si llega a 3 fallos, bloquear por 5 minutos
        if (newAttempts >= 3) {
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 5); 
          updateData.lock_until = lockTime.toISOString();
        }

        await supabase.from('profiles').update(updateData).eq('id', profile.id);
        
        if (newAttempts >= 3) throw new Error('Cuenta bloqueada por seguridad (3 intentos fallidos).');
      }
      throw new Error('Credenciales incorrectas');
    }

    // 4. SI ES ÉXITO: RESETEAR Y VERIFICAR MFA
    if (profile) {
      // Resetear intentos
      await supabase.from('profiles').update({ login_attempts: 0, lock_until: null }).eq('id', profile.id);

      // 🔐 REGLA DE ANGEL: Verificar si tiene MFA activo
      if (profile.mfa_enabled) {
        return { 
          requireMfa: true, 
          userId: data.user.id,
          tempSession: data.session // Guardar sesión temporalmente
        };
      }
    }

    return { session: data.session, user: data.user };
  },

  // --- MFA: GENERAR QR ---
  async generateMfaSecret(userId) {
    const secret = speakeasy.generateSecret({ name: "SteamClone Project" });
    
    // Guardar secreto en Supabase
    await supabase.from('profiles').update({ mfa_secret: secret.base32 }).eq('id', userId);
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCode: qrCodeUrl };
  },

  // --- MFA: VERIFICAR CÓDIGO ---
  async verifyMfa(userId, token) {
    const { data: profile } = await supabase.from('profiles').select('mfa_secret').eq('id', userId).single();
    
    if (!profile?.mfa_secret) throw new Error("MFA no configurado");

    const verified = speakeasy.totp.verify({
      secret: profile.mfa_secret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      // Activar MFA definitivamente
      await supabase.from('profiles').update({ mfa_enabled: true }).eq('id', userId);
      return true;
    }
    return false;
  }
};