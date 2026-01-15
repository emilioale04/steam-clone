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

	// Método traer todos los trades activos (Pendientes)
	async getAllActiveTrades() {
		const { data, error } = await supabase
			.from('trade')
			.select('*, items(name)')
			.eq('status', 'Pendiente');

		if (data === null) return [];

		if (error) throw error;

		return data;
	},

	async postTrade(offererId, itemId) {
		// Lógica para crear una nueva oferta de intercambio
		const { data, error } = await supabase
			.from('trade')
			.insert([
				{
					offerer_id: offererId,
					item_id: itemId,
					status: ALLOWED_STATUSES.PENDING,
					created_at: new Date().toISOString(),
					expires_at: new Date().toISOString(),
				},
			])
			.select();

		if (error) throw error;

		return {
			success: true,
			data,
			message: 'Oferta de intercambio creada exitosamente',
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

export const tradeOfferService = {};
