import { tradeOfferService, tradeService } from '../services/tradeService.js';

export const tradeController = {
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
};
