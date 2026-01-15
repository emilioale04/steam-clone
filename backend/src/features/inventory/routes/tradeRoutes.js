import express from 'express';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import { tradeController } from '../controllers/tradeController.js';

const tradeRouter = express.Router();

// Obtener todos los trades activos
tradeRouter.get('/actives', tradeController.getActiveTrades);
// Postear intercambio
tradeRouter.post('/post', requireAuth, tradeController.postTrade);
// Aceptar un trade
tradeRouter.post('/accept/:tradeId', requireAuth, tradeController.acceptTrade);
// Cancelar un trade
tradeRouter.post('/reject/:tradeId', requireAuth, tradeController.cancelTrade);

// Enviar oferta para un trade
tradeRouter.post('/offer', requireAuth, tradeController.postTradeOffer);
// Obtener ofertas de un trade
tradeRouter.get('/offers/:tradeId', tradeController.getOffersForTrade);
// cancelar oferta de un trade
tradeRouter.post('/offer/reject/:offerId', requireAuth, tradeController.cancelTradeOffer);

export default tradeRouter;
