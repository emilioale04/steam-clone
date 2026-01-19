/**
 * Pricing Routes - Rutas para gestión de precios
 * 
 * Implementa RF-010 (Definición de Precios) con:
 * - Autenticación JWT obligatoria
 * - MFA obligatorio para acciones críticas (RNF-001, C14)
 * - Rate limiting (RNF-007, C7)
 */

import express from 'express';
import { 
  getDeveloperApps, 
  getAppDetails, 
  updatePrice, 
  updateDiscount 
} from '../controllers/priceController.js';
import { requireDesarrollador } from '../../developer-auth/middleware/developerAuthMiddleware.js';
import { criticalActionsLimiter } from '../../../shared/middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/pricing/my-apps
 * Obtiene las aplicaciones del desarrollador para gestionar precios
 * 
 * Requiere: JWT de desarrollador
 */
router.get(
  '/my-apps',
  requireDesarrollador,
  getDeveloperApps
);

/**
 * GET /api/pricing/app/:appId
 * Obtiene detalles de una aplicación específica
 * 
 * Requiere: JWT de desarrollador
 */
router.get(
  '/app/:appId',
  requireDesarrollador,
  getAppDetails
);

/**
 * PUT /api/pricing/update-price
 * Actualiza el precio de una aplicación
 * 
 * Requiere: JWT + MFA verificado en controlador (C14)
 * Body: { appId, newPrice, codigoMFA }
 * 
 * Restricciones:
 * - Solo 10 cambios por hora (rate limiting)
 * - Solo cada 30 días por aplicación (Política ABAC)
 */
router.put(
  '/update-price',
  criticalActionsLimiter,
  requireDesarrollador,
  updatePrice
);

/**
 * PUT /api/pricing/update-discount
 * Actualiza el descuento de una aplicación
 * 
 * Requiere: JWT + MFA verificado en controlador (C14)
 * Body: { appId, newDiscount, codigoMFA }
 */
router.put(
  '/update-discount',
  criticalActionsLimiter,
  requireDesarrollador,
  updateDiscount
);

export default router;



