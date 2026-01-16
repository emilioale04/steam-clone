import supabase from '../../../shared/config/supabase.js';

const ALLOWED_STATUSES = {
	PENDING: 'Pendiente',
	ACCEPTED: 'Aceptada',
	REJECTED: 'Rechazada',
	EXPIRED: 'Expirada',
	CANCELLED: 'Cancelada',
};

// Validar que el estado sea uno de los permitidos
const isValidStatus = (status) => {
	return Object.values(ALLOWED_STATUSES).includes(status);
};

// Método genérico para actualizar estado
const updateTradeStatus = async (id, newStatus) => {
	// Validar el estado
	if (!isValidStatus(newStatus)) {
		throw new Error(
			`Estado inválido. Los estados permitidos son: ${Object.values(
				ALLOWED_STATUSES
			).join(', ')}`
		);
	}

	const { data, error } = await supabase
		.from('trade')
		.update({
			status: newStatus,
			updated_at: new Date().toISOString(), // Añadir timestamp de actualización
		})
		.eq('id', id)
		.select();

	if (error) throw error;

	return {
		success: true,
		data,
		message: `Estado actualizado a: ${newStatus}`,
	};
};

export const tradeService = {
	ALLOWED_STATUSES,

	// Método para traer todos los trades activos (Pendientes) con relaciones
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
			console.log('Yo: ', offererId, 'Item: ', itemId);

			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + 7);

			const { data, error } = await supabase.rpc('create_trade_and_lock_item', {
				p_offerer_id: offererId,
				p_item_id: itemId,
				p_expiry_date: expiryDate.toISOString(),
			});
			if (error) throw error;

			return {
				success: true,
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

			return data;
		} catch (error) {
			console.error('Error accepting trade:', error);
			throw error;
		}
	},

	async getOffers(tradeId) {
		console.log('Invocando RPC con ID:', tradeId);

		const { data, error, status, statusText } = await supabase.rpc('get_trade_offers', {
			trade_id_param: tradeId,
		});

		if (error) {
			console.error('Error de Supabase:', error.message);
			throw error;
		}

		console.log('Respuesta status:', status); // Si es 200 y llega [], es un tema de RLS o parámetros.
		console.log('Datos recibidos:', data);
		return data;
	},

	async canceltradeById(tradeId) {
		const { data, error } = await supabase
			.from('trade')
			.update({
				status: ALLOWED_STATUSES.CANCELLED,
				expired_at: new Date().toISOString(),
				is_locked: false,
			})
			.eq('id', tradeId)
			.select();
		if (error) throw error;

		// librar el item asociado
		const { item, itemError } = await supabase
			.from('items')
			.update({
				is_locked: false,
			})
			.eq('id', data[0].item_id)
			.select()
			.single();
		if (itemError) throw itemError;

		// rechazar todas las ofertas asociadas
		const { data: offersData, error: offersError } = await supabase
			.from('trade_offer')
			.update({
				status: ALLOWED_STATUSES.CANCELLED,
			})
			.eq('trade_id', tradeId)
			.eq('status', ALLOWED_STATUSES.PENDING)
			.select();
		if (offersError) throw offersError;

		return {
			success: true,
			data,
			message: 'Intercambio cancelado exitosamente',
		};
	},

	// Métodos específicos para cada estado (opcionales, para mayor claridad)
	async setPendingStatus(id) {
		return updateTradeStatus(id, ALLOWED_STATUSES.PENDING);
	},

	async setAcceptedStatus(id) {
		return updateTradeStatus(id, ALLOWED_STATUSES.ACCEPTED);
	},

	async setRejectedStatus(id) {
		return updateTradeStatus(id, ALLOWED_STATUSES.REJECTED);
	},

	async setExpiredStatus(id) {
		return updateTradeStatus(id, ALLOWED_STATUSES.EXPIRED);
	},

	async setCalcelStatus(id) {
		return updateTradeStatus(id, ALLOWED_STATUSES.CANCELLED);
	},

	// Método para validar transiciones de estado si es necesario
	async validateStatusTransition(itemId, newStatus) {
		const currentStatus = await this.getCurrentStatus(itemId);

		// Aquí puedes añadir lógica de validación de transiciones
		// Por ejemplo, si no quieres permitir cambiar de "Expirada" a otro estado
		if (
			currentStatus === ALLOWED_STATUSES.EXPIRED &&
			newStatus !== ALLOWED_STATUSES.EXPIRED
		) {
			throw new Error('No se puede cambiar el estado de un item expirado');
		}

		return { currentStatus, newStatus, isValid: true };
	},
};

// Método genérico para actualizar estado
const updateTradeOfferStatus = async (id, newStatus) => {
	// Validar el estado
	if (!isValidStatus(newStatus)) {
		throw new Error(
			`Estado inválido. Los estados permitidos son: ${Object.values(
				ALLOWED_STATUSES
			).join(', ')}`
		);
	}

	const { data, error } = await supabase
		.from('trade_offers')
		.update({
			status: newStatus,
		})
		.eq('id', id)
		.select();

	if (error) throw error;

	return {
		success: true,
		data,
		message: `Estado actualizado a: ${newStatus}`,
	};
};

export const tradeOfferService = {
	async postTradeOffer(offererId, tradeId, itemId) {
		try {
			const { data, error } = await supabase.rpc('post_trade_offer_atomic', {
				arg_trade_id: tradeId, // ¡Verifica que estos valores no sean undefined!
				arg_offerer_id: offererId,
				arg_item_id: itemId, // Este es el que faltaba en tu error
				arg_status: 'Pendiente', // Coincide con arg_status
			});

			if (error) {
				console.error('Error detallado:', error);
				throw error;
			}

			return data;
		} catch (error) {
			console.error('Error en postTradeOffer:', error);
			throw error;
		}
	},

	async cancelTradeOffer(id) {
		// liberar el item ofrecido
		const { tradeOffer, error } = await supabase
			.from('trade_offer')
			.eq('id', id)
			.select()
			.single();
		if (error) throw error;

		const { item, itemError } = await supabase
			.from('items')
			.update({
				is_locked: false,
			})
			.eq('id', tradeOffer.item_id)
			.select()
			.single();
		if (itemError) throw itemError;

		return updateTradeOfferStatus(id, ALLOWED_STATUSES.CANCELLED);
	},
};
