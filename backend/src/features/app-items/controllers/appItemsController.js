import { appItemsService } from '../services/appItemsService.js';

export const appItemsController = {
  async listarItems(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;

      const items = await appItemsService.listarItems(appId, desarrolladorId);

      return res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error) {
      console.error('[CONTROLLER] Error en listarItems:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al listar items',
      });
    }
  },

  async crearItem(req, res) {
    try {
      const { appId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { nombre, is_tradeable, is_marketable, activo } = req.body;
      const requestMetadata = {
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('user-agent'),
      };

      const itemCreado = await appItemsService.crearItem(
        appId,
        desarrolladorId,
        {
          nombre,
          is_tradeable,
          is_marketable,
          activo,
        },
        requestMetadata,
      );

      return res.status(201).json({
        success: true,
        mensaje: 'Item creado correctamente',
        data: itemCreado,
      });
    } catch (error) {
      console.error('[CONTROLLER] Error en crearItem:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al crear item',
      });
    }
  },

  async actualizarItem(req, res) {
    try {
      const { itemId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const { nombre, is_tradeable, is_marketable, activo } = req.body;

      const itemActualizado = await appItemsService.actualizarItem(
        itemId,
        desarrolladorId,
        {
          nombre,
          is_tradeable,
          is_marketable,
          activo,
        },
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Item actualizado correctamente',
        data: itemActualizado,
      });
    } catch (error) {
      console.error('[CONTROLLER] Error en actualizarItem:', error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al actualizar item',
      });
    }
  },

  async eliminarItem(req, res) {
    try {
      const { itemId } = req.params;
      const desarrolladorId = req.desarrollador.id;
      const requestMetadata = {
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('user-agent'),
      };

      const itemEliminado = await appItemsService.eliminarItem(
        itemId,
        desarrolladorId,
        requestMetadata,
      );

      return res.status(200).json({
        success: true,
        mensaje: 'Item eliminado correctamente',
        data: itemEliminado,
      });
    } catch (error) {
      console.error('[CONTROLLER] Error en eliminarItem:', error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          mensaje: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        mensaje: 'Error al eliminar item',
      });
    }
  },
};
