import { supabaseAdmin } from '../../../shared/config/supabase.js';

export const aplicacionesService = {
  

  async obtenerAplicacionesDesarrollador(desarrolladorId) {
    try {
      const { data: aplicaciones, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select(`
          id,
          app_id,
          nombre_juego,
          descripcion_corta,
          descripcion_larga,
          estado_revision,
          etiquetas,
          precio_base_usd,
          categoria_id,
          pago_registro_completado,
          portada_image_path,
          created_at,
          updated_at,
          categorias_contenido (
            id,
            nombre_categoria
          )
        `)
        .eq('desarrollador_id', desarrolladorId)
        .eq('estado_revision', 'aprobado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[APLICACIONES] Error al obtener aplicaciones:', error);
        throw new Error('Error al obtener aplicaciones');
      }

      // Mapear para incluir el nombre de categoría en un campo plano
      const aplicacionesFormateadas = (aplicaciones || []).map(app => ({
        ...app,
        categoria: app.categorias_contenido?.nombre_categoria || null
      }));

      return aplicacionesFormateadas;
    } catch (error) {
      console.error('[APLICACIONES] Error:', error);
      throw error;
    }
  }
};
