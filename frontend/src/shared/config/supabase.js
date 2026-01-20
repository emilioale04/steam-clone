import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase para el frontend
// Solo usa la ANON_KEY (clave pública) - segura para exponer en el cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas. La subida de archivos no funcionará.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export default supabase;
