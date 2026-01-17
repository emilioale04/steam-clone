import { aplicacionesService } from '../services/aplicacionesService.js';

export const aplicacionesController = {
  

  async obtenerAplicaciones(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;
      
      const aplicaciones = await aplicacionesService.obtenerAplicacionesDesarrollador(desarrolladorId);
      
      res.status(200).json({
        success: true,
        data: aplicaciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        mensaje: error.message || 'Error al obtener aplicaciones'
      });
    }
  }
};
