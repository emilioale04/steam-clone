import { auditService } from '../services/auditService.js';
import { limitedAccountService, LIMITED_ACCOUNT_MESSAGES } from '../services/limitedAccountService.js';

const RESTRICTED_METHODS = ['POST', 'PUT', 'DELETE'];

/**
 * Mapeo de rutas a tipos de operación para mensajes específicos
 */
const ROUTE_OPERATION_MAP = {
  '/api/inventory/purchase': 'purchase',
  '/api/inventory/sell': 'sell',
  '/api/inventory/listings': 'sell',
  '/api/trades': 'trade',
  '/api/trades/offer': 'trade_offer',
  '/api/privacy': 'privacy'
};

/**
 * Determina el tipo de operación basado en la ruta
 */
const getOperationType = (url) => {
  for (const [route, operation] of Object.entries(ROUTE_OPERATION_MAP)) {
    if (url.includes(route)) {
      return operation;
    }
  }
  return 'generic';
};

/**
 * Valida elegibilidad de cuenta para operaciones comerciales
 * Las cuentas limitadas (is_limited = true) no pueden:
 * - Comprar artículos
 * - Vender artículos
 * - Crear intercambios
 * - Enviar ofertas de intercambio
 * 
 * Para desbloquear: recargar mínimo $5.00 en la wallet
 */
export const limitedAccountValidationMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión para realizar esta acción',
      });
    }

    // Solo restringe operaciones de escritura (comerciales)
    if (!RESTRICTED_METHODS.includes(req.method)) {
      return next();
    }

    // Verificar si la cuenta está limitada
    const isLimited = await limitedAccountService.isAccountLimited(userId);

    if (isLimited) {
      const operationType = getOperationType(req.originalUrl);
      const accountStatus = await limitedAccountService.getAccountStatus(userId);

      await auditService.logEvent({
        userId,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        reason: 'Limited account restriction',
        details: {
          operationType,
          totalReloaded: accountStatus.totalReloaded,
          remaining: accountStatus.remaining
        }
      });

      return res.status(403).json({
        success: false,
        code: 'LIMITED_ACCOUNT',
        message: limitedAccountService.getErrorMessage(operationType),
        isLimited: true,
        accountStatus: {
          totalReloaded: accountStatus.totalReloaded,
          unlockAmount: accountStatus.unlockAmount,
          remaining: accountStatus.remaining
        }
      });
    }

    next();
  } catch (error) {
    console.error('Limited account validation error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Error al validar el estado de la cuenta',
    });
  }
};
