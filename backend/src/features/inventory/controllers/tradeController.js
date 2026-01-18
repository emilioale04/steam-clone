import { tradeOfferService, tradeService } from '../services/tradeService.js';
import { TRADE_LIMITS, isValidUUID } from '../config/priceConfig.js';

export const tradeController = {
	/**
	 * Obtener estado de límites de trading para el usuario autenticado
	 */
	async getTradeLimitsStatus(req, res) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'Usuario no autenticado'
				});
			}

			const status = await tradeService.getTradeLimitsStatus(userId);
			res.json({
				success: true,
				...status,
				maxOffersPerTrade: TRADE_LIMITS.MAX_OFFERS_PER_TRADE
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: error.message
			});
		}
	},

	/**
	 * Obtener trades activos
	 */
	async getActiveTrades(req, res) {
		try {
			const { userId } = req.params;
			const viewerId = req.user?.id;

			const trades = await tradeService.getAllActiveTrades();

			res.json({
				success: true,
				data: trades,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	/**
	 * Postear un nuevo trade
	 */
	async postTrade(req, res) {
		try {
			const { offererId, itemId } = req.body;
			const requesterId = req.user?.id;

			// if (offererId !== requesterId) {
			// 	console.log(offererId, requesterId);
			// 	throw new Error(
			// 		'No tienes permiso para ofrecer un intercambio en nombre de otro usuario.'
			// 	);
			// }

			const trade = await tradeService.postTrade(requesterId, itemId);

			res.json({
				success: true,
				data: trade,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async acceptTrade(req, res) {
		try {
			const { tradeOfferId } = req.params;
			const requesterId = req.user?.id;

			const result = await tradeService.acceptTrade(tradeOfferId);
			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async cancelTrade(req, res) {
		try {
			const { tradeId } = req.params;
			const requesterId = req.user?.id;
			const result = await tradeService.cancelTradeById(tradeId);
			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async postTradeOffer(req, res) {
		try {
			const { offererId, tradeId, itemId } = req.body;
			const requesterId = req.user?.id;
			const tradeOffer = await tradeOfferService.postTradeOffer(
				requesterId,
				tradeId,
				itemId
			);

			res.json({
				success: true,
				data: tradeOffer,
			});
		} catch (error) {
			// Determinar código de estado apropiado
			let statusCode = 500;
			let errorCode = 'INTERNAL_ERROR';
			
			if (error.code === 'PRIVACY_RESTRICTED' || error.isPrivacyError) {
				statusCode = 403;
				errorCode = 'PRIVACY_RESTRICTED';
			} else if (error.message.includes('permiso')) {
				statusCode = 403;
				errorCode = 'FORBIDDEN';
			} else if (error.message.includes('no encontrado') || error.message.includes('no está disponible')) {
				statusCode = 404;
				errorCode = 'NOT_FOUND';
			} else if (error.message.includes('límite') || error.message.includes('Ya has ofertado')) {
				statusCode = 400;
				errorCode = 'BAD_REQUEST';
			}

			res.status(statusCode).json({
				success: false,
				code: errorCode,
				message: error.message,
			});
		}
	},

	async getOffersForTrade(req, res) {
		try {
			const { tradeId } = req.params;
			const requesterId = req.user?.id;
			const offers = await tradeService.getOffers(tradeId);

			res.json({
				success: true,
				data: offers,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async getTradeOffersByItemId(req, res) {
		try {
			const { itemId } = req.params;
			const requesterId = req.user?.id;
			const offers = await tradeOfferService.getTradeOfferByItemId(itemId);
			res.json({
				success: true,
				data: offers,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async rejectTradeOffer(req, res) {
		try {
			const { offerId } = req.params;
			const requesterId = req.user?.id;
			const result = await tradeOfferService.rejectTradeOfferServ(offerId);

			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async cancelTradeOffer(req, res) {
		try {
			const { offerId } = req.params;
			const requesterId = req.user?.id;
			const result = await tradeOfferService.cancelTradeOfferServ(offerId);

			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	/**
	 * Obtener las ofertas que el usuario autenticado ha realizado
	 */
	async getMyOffers(req, res) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'Usuario no autenticado'
				});
			}

			const offers = await tradeOfferService.getMyOffers(userId);
			res.json({
				success: true,
				data: offers
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: error.message
			});
		}
	},
};
