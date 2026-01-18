import supabase from '../../../shared/config/supabase.js';
import { TRADE_LIMITS, isValidUUID } from '../config/priceConfig.js';

const ALLOWED_STATUSES = {
	PENDING: 'Pendiente',
	ACCEPTED: 'Aceptada',
	REJECTED: 'Rechazada',
	EXPIRED: 'Expirada',
	CANCELLED: 'Cancelada',
};

export const tradeService = {
	/**
	 * Obtiene el conteo de trades activos de un usuario
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<number>}
	 */
	async getActiveTradesCount(userId) {
		if (!isValidUUID(userId)) {
			throw new Error('ID de usuario inválido');
		}

		const { count, error } = await supabase
			.from('trade')
			.select('*', { count: 'exact', head: true })
			.eq('offerer_id', userId)
			.eq('status', 'Pendiente');

		if (error) throw error;
		return count || 0;
	},

	/**
	 * Obtiene el conteo de ofertas en un trade específico
	 * @param {string} tradeId - ID del trade
	 * @returns {Promise<number>}
	 */
	async getTradeOffersCount(tradeId) {
		if (!isValidUUID(tradeId)) {
			throw new Error('ID de trade inválido');
		}

		const { count, error } = await supabase
			.from('trade_offer')
			.select('*', { count: 'exact', head: true })
			.eq('trade_id', tradeId)
			.eq('status', 'Pendiente');

		if (error) throw error;
		return count || 0;
	},

	/**
	 * Obtiene el estado de límites de trading para un usuario
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Object>}
	 */
	async getTradeLimitsStatus(userId) {
		const activeCount = await this.getActiveTradesCount(userId);
		return {
			activeCount,
			maxAllowed: TRADE_LIMITS.MAX_ACTIVE_TRADES,
			remaining: Math.max(0, TRADE_LIMITS.MAX_ACTIVE_TRADES - activeCount),
			limitReached: activeCount >= TRADE_LIMITS.MAX_ACTIVE_TRADES
		};
	},

	async getAllActiveTrades() {
		const { data, error } = await supabase
			.from('trade')
			.select(
				`
      *,
      item:item_id ( name, steam_item_id ),
      offerer:offerer_id ( username ),
      receiver:receiver_id ( username )
    `
			)
			.eq('status', 'Pendiente'); // Asegúrate que coincida con el texto en la DB

		if (error) throw error;
		return data;
	},

	async postTrade(offererId, itemId) {
		try {
			// Validar UUIDs
			if (!isValidUUID(offererId)) {
				throw new Error('ID de usuario inválido');
			}
			if (!isValidUUID(itemId)) {
				throw new Error('ID de item inválido');
			}

			// Verificar límite de trades activos
			const activeCount = await this.getActiveTradesCount(offererId);
			if (activeCount >= TRADE_LIMITS.MAX_ACTIVE_TRADES) {
				throw new Error(`Has alcanzado el límite máximo de ${TRADE_LIMITS.MAX_ACTIVE_TRADES} intercambios activos. Cancela alguno para crear más.`);
			}

			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + TRADE_LIMITS.TRADE_EXPIRY_DAYS);

			const { data, error } = await supabase.rpc('create_trade_and_lock_item', {
				p_offerer_id: offererId,
				p_item_id: itemId,
				p_expiry_date: expiryDate.toISOString(),
			});
			if (error) throw error;

			return {
				data: data,
				message: 'Oferta de intercambio creada exitosamente',
			};
		} catch (error) {
			console.error('Error en postTrade:', error);
			throw error;
		}
	},

	async acceptTrade(tradeOfferId) {
		try {
			const { data, error } = await supabase.rpc('accept_trade', {
				offer_id_param: tradeOfferId,
			});

			if (error) throw error;

			if (!data.success) {
				throw new Error(data.message);
			}

			return 'Intercambio exitoso';
		} catch (error) {
			console.error('Error accepting trade:', error);
			throw error;
		}
	},

	async getOffers(tradeId) {
		const { data, error, status, statusText } = await supabase.rpc('get_trade_offers', {
			trade_id_param: tradeId,
		});

		if (error) {
			console.error('Error de Supabase:', error.message);
			throw error;
		}
		return data;
	},

	async cancelTradeById(tradeId) {
		try {
			const { data, error } = await supabase.rpc('cancel_trade_by_id', {
				trade_id_param: tradeId,
			});

			if (error) throw error;

			if (!data.success) {
				throw new Error(data.message);
			}

			return 'Intercambio cancelado, se liberaron todos los objetos';
		} catch (error) {
			console.error('Error al cancelar el trade:', error);
			throw error;
		}
	},
};

export const tradeOfferService = {
	async postTradeOffer(offererId, tradeId, itemId) {
		try {
			// Validar UUIDs
			if (!isValidUUID(offererId)) {
				throw new Error('ID de usuario inválido');
			}
			if (!isValidUUID(tradeId)) {
				throw new Error('ID de trade inválido');
			}
			if (!isValidUUID(itemId)) {
				throw new Error('ID de item inválido');
			}

			// Verificar límite de ofertas por trade
			const offersCount = await tradeService.getTradeOffersCount(tradeId);
			if (offersCount >= TRADE_LIMITS.MAX_OFFERS_PER_TRADE) {
				throw new Error(`Este intercambio ha alcanzado el límite máximo de ${TRADE_LIMITS.MAX_OFFERS_PER_TRADE} ofertas.`);
			}

			// Verificar que el usuario no haya ofertado ya con el mismo item en este trade
			const { data: existingOffer, error: checkError } = await supabase
				.from('trade_offer')
				.select('id')
				.eq('trade_id', tradeId)
				.eq('offerer_id', offererId)
				.eq('item_id', itemId)
				.eq('status', 'Pendiente')
				.maybeSingle();

			if (checkError) throw checkError;
			if (existingOffer) {
				throw new Error('Ya has ofertado este item en este intercambio.');
			}

			const { error } = await supabase.rpc('post_trade_offer_atomic', {
				arg_trade_id: tradeId,
				arg_offerer_id: offererId,
				arg_item_id: itemId,
				arg_status: 'Pendiente',
			});

			if (error) {
				console.error('Error detallado:', error);
				throw error;
			}

			return 'Oferta enviada';
		} catch (error) {
			console.error('Error en postTradeOffer:', error);
			throw error;
		}
	},

	async getTradeOfferByItemId(itemId) {
		try {
			const { data, error } = await supabase
				.from('trade_offer')
				.select('*')
				.eq('item_id', itemId)
				.eq('status', 'Pendiente')
				.maybeSingle();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Error getting trade offer by item ID:', error);
			throw error;
		}
	},

	async rejectTradeOfferServ(offerId) {
		try {
			const { error } = await supabase.rpc('reject_trade_offer', {
				offer_id_param: offerId,
			});

			if (error) throw error;

			return 'Oferta rechazada';
		} catch (error) {
			console.error('Error rejecting trade offer:', error.message);
			throw error;
		}
	},

	async cancelTradeOfferServ(id) {
		try {
			await new Promise((resolve) => setTimeout(resolve, 5000));

			const { error } = await supabase.rpc('cancel_trade_offer_and_unlock', {
				offer_id_param: id,
			});

			if (error) throw error;

			return 'Oferta cancelada, el objeto ha sido liberado';
		} catch (error) {
			console.error('Error en el proceso de cancelación:', error.message);
			throw error;
		}
	},

	/**
	 * Obtiene todas las ofertas que un usuario ha realizado en intercambios de otros
	 * @param {string} userId - ID del usuario
	 * @returns {Promise<Array>}
	 */
	async getMyOffers(userId) {
		if (!isValidUUID(userId)) {
			throw new Error('ID de usuario inválido');
		}

		try {
			const { data, error } = await supabase
				.from('trade_offer')
				.select(`
					*,
					item:item_id ( id, name, steam_item_id ),
					trade:trade_id (
						id,
						status,
						item:item_id ( id, name, steam_item_id ),
						offerer:offerer_id ( id, username )
					)
				`)
				.eq('offerer_id', userId)
				.eq('status', 'Pendiente')
				.order('created_at', { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error getting user offers:', error);
			throw error;
		}
	},
};
