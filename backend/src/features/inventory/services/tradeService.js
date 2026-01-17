import supabase from '../../../shared/config/supabase.js';

const ALLOWED_STATUSES = {
	PENDING: 'Pendiente',
	ACCEPTED: 'Aceptada',
	REJECTED: 'Rechazada',
	EXPIRED: 'Expirada',
	CANCELLED: 'Cancelada',
};

export const tradeService = {
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
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + 7);

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
			const { error } = await supabase.rpc('post_trade_offer_atomic', {
				arg_trade_id: tradeId, // ¡Verifica que estos valores no sean undefined!
				arg_offerer_id: offererId,
				arg_item_id: itemId, // Este es el que faltaba en tu error
				arg_status: 'Pendiente', // Coincide con arg_status
			});

			if (error) {
				console.error('Error detallado:', error);
				throw error;
			}

			return 'Oferta eviada';
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
};
