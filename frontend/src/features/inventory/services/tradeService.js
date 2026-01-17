const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const tradeService = {
	async getTradesActive() {
		const response = await fetch(`${API_URL}/trade/actives`, {
			credentials: 'include', // httpOnly cookie sent automatically
		});

		const data = await response.json();
		if (!data.success) throw new Error(data.message);
		return data;
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
};
