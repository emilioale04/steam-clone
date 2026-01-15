import { tradeOfferService, tradeService } from '../services/tradeService.js';

export const tradeController = {
	/**
	 * Obtener trades activos
	 */
	async getActiveTrades(req, res) {
		try {
			const { userId } = req.params;
			const viewerId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req

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
			const requesterId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req

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
			const { tradeId } = req.params;
			const requesterId = req.user?.id;

			const result = await tradeService.acceptTrade(tradeId, requesterId);
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
			const requesterId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req
			const result = await tradeService.canceltradeById(requesterId, tradeId);
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
			const { tradeId, offeredItemId } = req.body;
			const requesterId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req
			const tradeOffer = await tradeOfferService.postTradeOffer(
				requesterId,
				tradeId,
				offeredItemId
			);

			res.json({
				success: true,
				data: tradeOffer,
			});
		} catch (error) {
			res.status(error.message.includes('permiso') ? 403 : 500).json({
				success: false,
				message: error.message,
			});
		}
	},

	async getOffersForTrade(req, res) {
		try {
			const { tradeId } = req.params;
			const requesterId = req.user?.id;
			const offers = await tradeOfferService.getOffersForTrade(requesterId, tradeId);

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

	async cancelTradeOffer(req, res) {
		try {
			const { offerId } = req.params;
			const requesterId = req.user?.id; // Asumiendo que el middleware de auth pone el user en req
			const result = await tradeOfferService.cancelTradeOffer(requesterId, offerId);

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
};
