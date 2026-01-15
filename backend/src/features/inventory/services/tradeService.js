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

			const { data, error } = await await supabase.rpc('create_trade_and_lock_item', {
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

	async acceptTrade(tradeId) {
		// buscar la oferta - fuente de verdad
		const { tradeOffer, error } = await supabase
			.from('trade_offer')
			.eq('id', tradeId)
			.single();
		console.log('offer', tradeOffer);
		if (error) throw error;

		// aceptar la oferta seleccionada
		const { offerAccepted, errorOfferAccepted } = await supabase
			.from('trade_offer')
			.update({
				status: ALLOWED_STATUSES.ACCEPTED,
			})
			.eq('id', tradeOffer.id)
			.select()
			.single();
		console.log('accepted', offerAccepted);
		if (errorOfferAccepted) throw errorOfferAccepted;

		// actualizar el trade principal
		const { myTrade, errorMyTrade } = await supabase
			.from('trade')
			.update({
				status: ALLOWED_STATUSES.ACCEPTED,
				receiver_id: offerAccepted.offerer_id,
				item_accepted_id: offerAccepted.item_id,
				expired_at: new Date().toISOString(),
			})
			.eq('id', offerAccepted.trade_id)
			.select()
			.single();
		console.log('trade', myTrade);
		if (errorMyTrade) throw errorMyTrade;

		// Dar item al nuevo dueño
		const { itemSended, errorItemSended } = await supabase
			.from('items')
			.update({
				is_locked: false,
				owner_id: offerAccepted.offerer_id,
			})
			.eq('id', myTrade.item_id)
			.select()
			.single();
		console.log('item', itemSended);
		if (errorItemSended) throw errorItemSended;

		// Recibir item del offerer
		const { itemReceived, errorItemReceived } = await supabase
			.from('items')
			.update({
				is_locked: false,
				owner_id: myTrade.offerer_id,
			})
			.eq('id', offerAccepted.item_id)
			.select()
			.single();
		console.log('item receiver', itemReceived);
		if (errorItemReceived) throw errorItemReceived;

		// rechazar otras ofertas pendientes
		const { rejected, errorRejected } = await supabase
			.from('trade_offer')
			.update({
				status: ALLOWED_STATUSES.REJECTED,
			})
			.eq('trade_id', tradeOffer.trade_id)
			.eq('status', ALLOWED_STATUSES.PENDING)
			.ne('id', tradeOffer.id)
			.select();
		console.log('rechazados', rejected);
		if (errorRejected) throw errorRejected;

		return {
			success: true,
			message: 'Intercambio aceptado exitosamente',
		};
	},

	async getOffers(tradeId) {
		const { data, error } = await supabase
			.from('trade_offer')
			.select('*, items(name)')
			.eq('trade_id', tradeId)
			.eq('status', ALLOWED_STATUSES.PENDING);
		if (error) throw error;

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
	async postTradeOffer(tradeId, offererId, itemId) {
		// Lógica para crear una nueva oferta de intercambio
		const { data, error } = await supabase
			.from('trade_offer')
			.insert([
				{
					trade_id: tradeId,
					offerer_id: offererId,
					item_id: itemId,
					status: ALLOWED_STATUSES.PENDING,
					created_at: new Date().toISOString(),
				},
			])
			.select();

		if (error) throw error;

		// bloquear el item ofrecido
		const { item, itemError } = await supabase
			.from('items')
			.update({
				is_locked: true,
			})
			.eq('id', itemId)
			.select()
			.single();
		if (itemError) throw itemError;

		return {
			success: true,
			data,
			message: 'Oferta enviada exitosamente',
		};
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
