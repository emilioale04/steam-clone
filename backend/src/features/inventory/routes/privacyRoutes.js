import express from 'express';
import { privacyController } from '../controllers/privacyController.js';
import { requireAuth, optionalAuth } from '../../../shared/middleware/authMiddleware.js';
import { limitedAccountValidationMiddleware } from '../../../shared/middleware/limitedAccountValidationMiddleware.js';

const router = express.Router();

// =====================================================
// RUTAS DE CONFIGURACIÓN DE PRIVACIDAD
// =====================================================

// Obtener configuración de privacidad del usuario autenticado
router.get('/settings', requireAuth, privacyController.getPrivacySettings);

// Actualizar configuración de privacidad del usuario autenticado
// Requiere cuenta no limitada para modificar privacidad
router.put('/settings', requireAuth, limitedAccountValidationMiddleware, privacyController.updatePrivacySettings);

// =====================================================
// RUTAS DE VERIFICACIÓN DE ACCESO
// =====================================================

// Verificar acceso al inventario de un usuario
router.get('/check/inventory/:userId', optionalAuth, privacyController.checkInventoryAccess);

// Verificar acceso para enviar trade a un usuario
router.get('/check/trade/:userId', requireAuth, privacyController.checkTradeAccess);

// Verificar acceso para comprar de un usuario en marketplace
router.get('/check/marketplace/:userId', requireAuth, privacyController.checkMarketplaceAccess);

// Obtener información de privacidad pública de un perfil
router.get('/profile/:userId', optionalAuth, privacyController.getProfilePrivacyInfo);

export default router;
