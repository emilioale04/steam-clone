import { useEffect, useState } from 'react';
import { tradeService } from '../services/tradeService';

export const useTrade = (userId) => {
	const [trades, setTrades] = useState([]);
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

	useEffect(() => {
		fetchActiveTrades();
	}, []);

	return { trades, loading, error, refetch: fetchActiveTrades, postTrade };
};
