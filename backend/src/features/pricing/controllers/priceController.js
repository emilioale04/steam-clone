/**
 * Price Controller - Controladores para gestión de precios
 * 
 * Implementa los endpoints para RF-010 (Definición de Precios)
 * con verificación MFA obligatoria (RNF-001, C14)
 */

import pricingService from '../services/pricingService.js';
import { auditService, ACCIONES_AUDITORIA, RESULTADOS } from '../../../shared/services/auditService.js';
import mfaService from '../../mfa/services/mfaService.js';

/**
 * GET /api/pricing/my-apps
 * Obtiene las aplicaciones del desarrollador autenticado
 * 
 * Requiere: JWT válido
 * Retorna: Lista de aplicaciones con info de precios y restricciones
 */
export const getDeveloperApps = async (req, res) => {
  try {
    const developerId = req.user.id;

    const result = await pricingService.getDeveloperApps(developerId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      apps: result.apps,
      total: result.total,
      message: result.total === 0 
        ? 'No tienes aplicaciones aprobadas para gestionar precios' 
        : `Se encontraron ${result.total} aplicación(es)`
    });

  } catch (error) {
    console.error('Error en getDeveloperApps:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener aplicaciones'
    });
  }
};

/**
 * GET /api/pricing/app/:appId
 * Obtiene una aplicación específica con validación de propiedad
 * 
 * Requiere: JWT válido
 * Parámetros: appId (UUID)
 */
export const getAppDetails = async (req, res) => {
  try {
    const developerId = req.user.id;
    const { appId } = req.params;

    if (!appId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la aplicación'
      });
    }

    const result = await pricingService.getAppById(appId, developerId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.app
    });

  } catch (error) {
    console.error('Error en getAppDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * PUT /api/pricing/update-price
 * Actualiza el precio de una aplicación
 * 
 * Requiere: JWT válido + MFA verificado (C14)
 * Body: { appId, newPrice, mfaCode }
 * 
 * Validaciones:
 * - C11: Precio >= 0
 * - C12: Precio <= 1000 USD
 * - C18: Propiedad de la aplicación
 * - Política ABAC: 30 días entre cambios
 */
export const updatePrice = async (req, res) => {
  try {
    const developerId = req.user.id;
    const { appId, newPrice, codigoMFA } = req.body;

    // Validación de parámetros requeridos
    if (!appId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la aplicación'
      });
    }

    if (newPrice === undefined || newPrice === null) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el nuevo precio'
      });
    }

    // Verificación MFA obligatoria (C14)
    if (!codigoMFA) {
      return res.status(400).json({
        success: false,
        message: 'Código MFA requerido para actualizar precios',
        requiresMFA: true
      });
    }

    // Verificar código MFA
    const mfaValido = await mfaService.verifyTOTP(developerId, codigoMFA, 'developer');
    if (!mfaValido) {
      await auditService.registrarEvento({
        desarrolladorId: developerId,
        accion: ACCIONES_AUDITORIA.ACTUALIZAR_PRECIO,
        recurso: `aplicacion:${appId}`,
        detalles: { error: 'Código MFA inválido' },
        resultado: RESULTADOS.FALLIDO,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Código MFA inválido'
      });
    }

    // Ejecutar actualización
    const result = await pricingService.updatePrice(appId, developerId, newPrice);

    if (!result.success) {
      // Registrar intento fallido en auditoría
      await auditService.registrarEvento({
        desarrolladorId: developerId,
        accion: ACCIONES_AUDITORIA.ACTUALIZAR_PRECIO,
        recurso: `aplicacion:${appId}`,
        detalles: { 
          precio_intentado: newPrice, 
          error: result.error 
        },
        resultado: RESULTADOS.FALLIDO,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Registrar éxito en auditoría (RNF-008)
    await auditService.registrarEvento({
      desarrolladorId: developerId,
      accion: ACCIONES_AUDITORIA.ACTUALIZAR_PRECIO,
      recurso: `aplicacion:${appId}`,
      detalles: {
        precio_anterior: result.app.precio_anterior,
        precio_nuevo: result.app.precio_nuevo
      },
      resultado: RESULTADOS.EXITOSO,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: result.message,
      data: result.app
    });

  } catch (error) {
    console.error('Error en updatePrice:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el precio'
    });
  }
};

/**
 * PUT /api/pricing/update-discount
 * Actualiza el descuento de una aplicación
 * 
 * Requiere: JWT válido + MFA verificado (C14)
 * Body: { appId, newDiscount, mfaCode }
 * 
 * Validaciones:
 * - Descuento entre 0 y 1 (0% a 100%)
 * - C18: Propiedad de la aplicación
 */
export const updateDiscount = async (req, res) => {
  try {
    const developerId = req.user.id;
    const { appId, newDiscount, codigoMFA } = req.body;

    // Validación de parámetros requeridos
    if (!appId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la aplicación'
      });
    }

    if (newDiscount === undefined || newDiscount === null) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el nuevo descuento'
      });
    }

    // Verificación MFA obligatoria (C14)
    if (!codigoMFA) {
      return res.status(400).json({
        success: false,
        message: 'Código MFA requerido para actualizar descuentos',
        requiresMFA: true
      });
    }

    // Verificar código MFA
    const mfaValido = await mfaService.verifyTOTP(developerId, codigoMFA, 'developer');
    if (!mfaValido) {
      await auditService.registrarEvento({
        desarrolladorId: developerId,
        accion: 'actualizar_descuento',
        recurso: `aplicacion:${appId}`,
        detalles: { error: 'Código MFA inválido' },
        resultado: RESULTADOS.FALLIDO,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Código MFA inválido'
      });
    }

    // Ejecutar actualización
    const result = await pricingService.updateDiscount(appId, developerId, newDiscount);

    if (!result.success) {
      // Registrar intento fallido
      await auditService.registrarEvento({
        desarrolladorId: developerId,
        accion: 'actualizar_descuento',
        recurso: `aplicacion:${appId}`,
        detalles: { 
          descuento_intentado: newDiscount, 
          error: result.error 
        },
        resultado: RESULTADOS.FALLIDO,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Registrar éxito en auditoría
    await auditService.registrarEvento({
      desarrolladorId: developerId,
      accion: 'actualizar_descuento',
      recurso: `aplicacion:${appId}`,
      detalles: {
        descuento_nuevo: result.app.descuento,
        precio_final: result.app.precio_final
      },
      resultado: RESULTADOS.EXITOSO,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: result.message,
      data: result.app
    });

  } catch (error) {
    console.error('Error en updateDiscount:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el descuento'
    });
  }
};

