import { appItemsService } from '../services/appItemsService.js';
import mfaService from '../../mfa/services/mfaService.js';

const verificarMFA = async (res, desarrolladorId, codigoMFA) => {
  if (!codigoMFA) {
    res.status(400).json({
      success: false,
      mensaje: 'Codigo MFA requerido para esta accion',
      requiresMFA: true,
    });
    return false;
  }

  try {
    const mfaValido = await mfaService.verifyTOTP(
      desarrolladorId,
      codigoMFA,
      'developer',
    );

    if (!mfaValido) {
      res.status(401).json({
        success: false,
        mensaje: 'Codigo MFA invalido',
      });
      return false;
    }

    return true;
  } catch (error) {
    res.status(401).json({
      success: false,
      mensaje: error.message || 'Codigo MFA invalido',
    });
    return false;
  }
};

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

      if (error.message.includes('aprobada')) {
        return res.status(403).json({
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
      const { nombre, is_tradeable, is_marketable, activo, codigoMFA } = req.body;

      const mfaValido = await verificarMFA(
        res,
        desarrolladorId,
        codigoMFA,
      );
      if (!mfaValido) return;

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

      if (error.message.includes('aprobada')) {
        return res.status(403).json({
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
      const { nombre, is_tradeable, is_marketable, activo, codigoMFA } = req.body;

      const mfaValido = await verificarMFA(
        res,
        desarrolladorId,
        codigoMFA,
      );
      if (!mfaValido) return;

      const requestMetadata = {
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('user-agent'),
      };

      const itemActualizado = await appItemsService.actualizarItem(
        itemId,
        desarrolladorId,
        {
          nombre,
          is_tradeable,
          is_marketable,
          activo,
        },
        requestMetadata,
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

      if (error.message.includes('aprobada')) {
        return res.status(403).json({
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
      const { codigoMFA } = req.body;

      const mfaValido = await verificarMFA(
        res,
        desarrolladorId,
        codigoMFA,
      );
      if (!mfaValido) return;

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

      if (error.message.includes('aprobada')) {
        return res.status(403).json({
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
