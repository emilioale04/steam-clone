const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const tradeService = {
	/**
	 * Obtener estado de límites de trading del usuario autenticado
	 * @returns {Promise<{activeCount: number, maxAllowed: number, remaining: number, limitReached: boolean, maxOffersPerTrade: number}>}
	 */
	async getTradeLimitsStatus() {
		const response = await fetch(`${API_URL}/trade/limits`, {
			credentials: 'include',
		});

		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data;
	},

	/**
	 * Obtener todas las ofertas que el usuario ha realizado en intercambios de otros
	 * @returns {Promise<Array>}
	 */
	async getMyOffers() {
		const response = await fetch(`${API_URL}/trade/my-offers`, {
			credentials: 'include',
		});

		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async getTradesActive() {
		const response = await fetch(`${API_URL}/trade/actives`, {
			credentials: 'include', // httpOnly cookie sent automatically
		});

		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data;
	},

	async acceptTrade(id) {
		const response = await fetch(`${API_URL}/trade/accept/${id}`, {
			method: 'POST',
			credentials: 'include',
		});
		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		console.log(data);
		return data.data;
	},

	async postTrade(offererId, itemId) {
		const response = await fetch(`${API_URL}/trade/post`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ offererId, itemId }),
		});
		const data = await response.json();
		if (!data.success) throw new Error(data.message);

		return data.data;
	},

	async cancelTradeById(tradeId) {
		const response = await fetch(`${API_URL}/trade/cancel/${tradeId}`, {
			method: 'POST',
			credentials: 'include',
		});
		const data = await response.json();
		console.log(data);
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async postTradeOffer(offererId, tradeId, itemId) {
		const response = await fetch(`${API_URL}/trade/offer`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ offererId, tradeId, itemId }),
		});
		const data = await response.json();
		console.log(data);
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async getTradeOffersByItemId(itemId) {
		const response = await fetch(`${API_URL}/trade/offer/${itemId}`, {
			credentials: 'include',
		});
		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async getOffersForTrade(tradeId) {
		const response = await fetch(`${API_URL}/trade/offers/${tradeId}`, {
			credentials: 'include',
		});
		const data = await response.json();
		// console.log("Datos recibidos en el service:", data.data);
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async cancelTradeOffer(offerId) {
		const response = await fetch(`${API_URL}/trade/offer/cancel/${offerId}`, {
			method: 'POST',
			credentials: 'include',
		});
		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data.data;
	},

	async rejectTradeOffer(offerId) {
		const response = await fetch(`${API_URL}/trade/offer/reject/${offerId}`, {
			method: 'POST',
			credentials: 'include',
		});
		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data.data;
	},
};
