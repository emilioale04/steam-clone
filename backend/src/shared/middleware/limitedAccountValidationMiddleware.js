import { auditService } from '../services/auditService.js';
import { sessionService } from '../services/sessionService.js';

const RESTRICTED_METHODS = ['POST', 'PUT', 'DELETE'];

/**
 * Valida elegibilidad de cuenta para operaciones comerciales
 */
export const limitedAccountValidationMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    // Solo restringe operaciones comerciales
    if (!RESTRICTED_METHODS.includes(req.method)) {
      return next();
    }

    const totalSpent = await sessionService.getUserSpending(userId);

    if (totalSpent < 5) {
      await auditService.logEvent({
        userId,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString(),
        reason: 'Limited account restriction',
      });

      return res.status(403).json({
        message: 'Operation not allowed',
      });
    }

    next();
  } catch (error) {
    console.error('Limited account validation error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
