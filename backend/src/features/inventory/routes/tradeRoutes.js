import express from 'express';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import { limitedAccountValidationMiddleware } from '../../../shared/middleware/limitedAccountValidationMiddleware.js';
import { tradeController } from '../controllers/tradeController.js';

const tradeRouter = express.Router();

// Obtener estado de límites de trading del usuario autenticado
tradeRouter.get('/limits', requireAuth, tradeController.getTradeLimitsStatus);

// Obtener todas las ofertas que el usuario ha realizado
tradeRouter.get('/my-offers', requireAuth, tradeController.getMyOffers);

// Obtener todos los trades activos
tradeRouter.get('/actives', tradeController.getActiveTrades);

// Postear intercambio (requiere cuenta no limitada)
tradeRouter.post('/post', requireAuth, limitedAccountValidationMiddleware, tradeController.postTrade);

// Aceptar un trade (requiere cuenta no limitada)
tradeRouter.post('/accept/:tradeOfferId', requireAuth, limitedAccountValidationMiddleware, tradeController.acceptTrade);

// Rechazar oferta de un trade
tradeRouter.post('/offer/reject/:offerId', requireAuth, tradeController.rejectTradeOffer);

// Cancelar un trade
tradeRouter.post('/cancel/:tradeId', requireAuth, tradeController.cancelTrade);

// Enviar oferta para un trade (requiere cuenta no limitada)
tradeRouter.post('/offer', requireAuth, limitedAccountValidationMiddleware, tradeController.postTradeOffer);

// Obtener oferta de un item
tradeRouter.get('/offer/:itemId', tradeController.getTradeOffersByItemId);

// Obtener ofertas de un trade
tradeRouter.get('/offers/:tradeId', tradeController.getOffersForTrade);

// Cancelar oferta de un trade
tradeRouter.post('/offer/cancel/:offerId', requireAuth, tradeController.cancelTradeOffer);

export default tradeRouter;
