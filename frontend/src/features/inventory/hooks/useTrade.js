import { useEffect, useState } from 'react';
import { tradeService } from '../services/tradeService';

export const useTrade = (userId) => {
	const [trades, setTrades] = useState([]);
	const [tradesForMe, setTradesForMe] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchActiveTrades = async () => {
		try {
			setLoading(true);
			const data = await tradeService.getTradesActive();
			setTrades(data);
			setError(null);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const acceptTrade = async (tradeId) => {
		try {
			setLoading(true);
			const response = await tradeService.acceptTrade(tradeId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const postTrade = async (itemId) => {
		try {
			setLoading(true);
			const response = await tradeService.postTrade(userId, itemId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const cancelTradeById = async (tradeId) => {
		try {
			setLoading(true);
			const response = await tradeService.cancelTradeById(tradeId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchActiveTrades();
	}, []);

	const postTradeOffer = async (tradeId, itemId) => {
		try {
			setLoading(true);
			const response = await tradeService.postTradeOffer(userId, tradeId, itemId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const getTradeOffersByItemId = async (itemId) => {
		try {
			setLoading(true);
			const response = await tradeService.getTradeOffersByItemId(itemId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const rejectTradeOffer = async (offerId) => {
		try {
			setLoading(true);
			const response = await tradeService.rejectTradeOffer(offerId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const cancelTradeOffer = async (offerId) => {
		try {
			setLoading(true);
			const response = await tradeService.cancelTradeOffer(offerId);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const getOffersForTrade = async (tradeId) => {
		try {
			setLoading(true);
			const response = await tradeService.getOffersForTrade(tradeId);
			setTradesForMe(response);
			setError(null);
			return response;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		trades,
		tradesForMe,
		loading,
		error,
		refetch: fetchActiveTrades,
		postTrade,
		postTradeOffer,
		acceptTrade,
		cancelTradeById,

		getOffersForTrade,
		getTradeOffersByItemId,
		cancelTradeOffer,
		rejectTradeOffer,
	};
};
