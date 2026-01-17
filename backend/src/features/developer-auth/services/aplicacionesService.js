import { supabaseAdmin } from '../../../shared/config/supabase.js';

export const aplicacionesService = {
  

  async obtenerAplicacionesDesarrollador(desarrolladorId) {
    try {
      const { data: aplicaciones, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select(`
          id,
          nombre_juego,
          descripcion_corta,
          estado_revision,
          created_at,
          updated_at
        `)
        .eq('desarrollador_id', desarrolladorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[APLICACIONES] Error al obtener aplicaciones:', error);
        throw new Error('Error al obtener aplicaciones');
      }

      return aplicaciones || [];
    } catch (error) {
      console.error('[APLICACIONES] Error:', error);
      throw error;
    }
  }
};
