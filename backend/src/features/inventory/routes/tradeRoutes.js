import express from 'express';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import { tradeController } from '../controllers/tradeController.js';

const tradeRouter = express.Router();

// Postear intercambio
tradeRouter.post('/post', requireAuth, tradeController.postTrade);

// Obtener todos los trades activos
tradeRouter.get('/actives', tradeController.getActiveTrades);

export default tradeRouter;
