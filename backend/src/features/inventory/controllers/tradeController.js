import { tradeService } from '../services/tradeService.js';

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
};
