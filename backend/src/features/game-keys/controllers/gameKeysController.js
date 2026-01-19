import { gameKeysService } from '../services/gameKeysService.js';

export const gameKeysController = {
  async crearLlave(req, res) {
    try {
      const { juegoId } = req.params;
      const { cantidad = 1 } = req.body; // Cantidad de llaves a generar
      const desarrolladorId = req.desarrollador.id;
      
      // Validar cantidad
      if (cantidad < 1 || cantidad > 5) {
        return res.status(400).json({
          success: false,
          mensaje: 'La cantidad debe estar entre 1 y 5'
        });
      }
      
      // Metadata de la request para auditoría
      const requestMetadata = {
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('user-agent')
      };
      
      // Generar múltiples llaves
      const llaves = [];
      for (let i = 0; i < cantidad; i++) {
        const resultado = await gameKeysService.crearLlave(
          juegoId,
          desarrolladorId,
          requestMetadata
        );
        llaves.push(resultado);
      }
      
      return res.status(201).json({
        success: true,
        mensaje: `${llaves.length} llave(s) generada(s) exitosamente`,
        data: {
          llaves: llaves,
          cantidad: llaves.length
        }
      });
      
    } catch (error) {
      console.error('[CONTROLLER] Error en crearLlave:', error);
      
      // Errores conocidos
      if (error.message.includes('permisos')) {
        return res.status(403).json({
          success: false,
          mensaje: error.message
        });
      }
      
      if (error.message.includes('Límite')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message,
          codigo: 'LIMITE_LLAVES_ALCANZADO'
        });
      }
      
      // Error genérico
      return res.status(500).json({
        success: false,
        mensaje: 'Error interno al generar llave'
      });
    }
  },
  

  async listarLlaves(req, res) {
    try {
      const { juegoId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      
      const resultado = await gameKeysService.listarLlavesJuego(
        juegoId,
        desarrolladorId
      );
      
      return res.status(200).json({
        success: true,
        data: resultado
      });
      
    } catch (error) {
      console.error('[CONTROLLER] Error en listarLlaves:', error);
      
      if (error.message.includes('permisos')) {
        return res.status(403).json({
          success: false,
          mensaje: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        mensaje: 'Error al listar llaves'
      });
    }
  },
  
  async desactivarLlave(req, res) {
    try {
      const { llaveId } = req.params;
      const { motivo } = req.body;
      const desarrolladorId = req.desarrollador.id;
      
      if (!motivo || motivo.trim() === '') {
        return res.status(400).json({
          success: false,
          mensaje: 'El motivo de desactivación es requerido'
        });
      }
      
      const resultado = await gameKeysService.desactivarLlave(
        llaveId,
        desarrolladorId,
        motivo
      );
      
      return res.status(200).json({
        success: true,
        data: resultado
      });
      
    } catch (error) {
      console.error('[CONTROLLER] Error en desactivarLlave:', error);
      
      if (error.message.includes('permisos')) {
        return res.status(403).json({
          success: false,
          mensaje: error.message
        });
      }
      
      if (error.message.includes('ya está desactivada')) {
        return res.status(400).json({
          success: false,
          mensaje: error.message
        });
      }
      
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          mensaje: 'Llave no encontrada'
        });
      }
      
      return res.status(500).json({
        success: false,
        mensaje: 'Error al desactivar llave'
      });
    }
  },
  
  /**
   * GET /api/game-keys/estadisticas/general
   * Obtiene estadísticas generales de llaves del desarrollador
   */
  async obtenerEstadisticas(req, res) {
    try {
      const desarrolladorId = req.desarrollador.id;
      
      const resultado = await gameKeysService.obtenerEstadisticas(desarrolladorId);
      
      return res.status(200).json({
        success: true,
        data: resultado
      });
      
    } catch (error) {
      console.error('[CONTROLLER] Error en obtenerEstadisticas:', error);
      
      return res.status(500).json({
        success: false,
        mensaje: 'Error al obtener estadísticas'
      });
    }
  }
};
