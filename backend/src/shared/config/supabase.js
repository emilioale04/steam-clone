import { createClient } from '@supabase/supabase-js'

// Cliente público para operaciones de auth del usuario
// IMPORTANTE: persistSession: false para evitar conflictos entre usuarios
// en un servidor compartido (cada request debe ser independiente)
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false  // No guardar sesión en el servidor
    }
  }
)

// Cliente admin con Service Role para operaciones del servidor
// Bypass RLS - usar solo en el backend para operaciones que requieren acceso a tablas
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default supabase;
export { supabaseAdmin };