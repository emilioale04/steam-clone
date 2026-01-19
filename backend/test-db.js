import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...\n');

  try {
    // Consultar aplicaciones de desarrolladores
    const { data: apps, error: appsError } = await supabase
      .from('aplicaciones_desarrolladores')
      .select('id, app_id, nombre_juego, precio_base_usd, estado_revision, updated_at, descuento')
      .limit(30);

    if (appsError) {
      console.error('❌ Error al consultar aplicaciones:', appsError.message);
      return;
    }

    console.log('✅ Conexión exitosa!\n');
    console.log(`📦 Aplicaciones encontradas: ${apps.length}\n`);

    if (apps.length > 0) {
      console.log('📋 Lista de aplicaciones:');
      console.table(apps.map(app => ({
        'App ID': app.app_id,
        'Nombre': app.nombre_juego,
        'Precio USD': `$${app.precio_base_usd}`,
        'Estado': app.estado_revision,
        'Última actualización': app.updated_at,
        'Descuento': app.descuento ? `${(app.descuento * 100).toFixed(0)}%` : '0%'
      })));
    } else {
      console.log('⚠️ No hay aplicaciones registradas.');
    }

    // Consultar desarrolladores
    const { data: devs, error: devsError } = await supabase
      .from('desarrolladores')
      .select('id, nombre_legal, pais, cuenta_activa')
      .limit(30);

    if (!devsError && devs.length > 0) {
      console.log('\n👨‍💻 Desarrolladores registrados:');
      console.table(devs.map(dev => ({
        'Nombre': dev.nombre_legal,
        'País': dev.pais,
        'Activo': dev.cuenta_activa ? '✅' : '❌'
      })));
    }

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

testConnection();
