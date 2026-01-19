const API_URL = 'http://localhost:3000/api/notifications';

export const notificationService = {
    // Obtener notificaciones del usuario
    async getNotifications(onlyUnread = false) {
        const url = onlyUnread ? `${API_URL}?onlyUnread=true` : API_URL;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Marcar notificación como leída
    async markAsRead(notificationId) {
        const response = await fetch(`${API_URL}/${notificationId}/read`, {
            method: 'PUT',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Marcar todas como leídas
    async markAllAsRead() {
        const response = await fetch(`${API_URL}/read-all`, {
            method: 'PUT',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar notificación
    async deleteNotification(notificationId) {
        const response = await fetch(`${API_URL}/${notificationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
