const API_URL = 'http://localhost:3000/api/community';

export const announcementService = {
    // Obtener anuncios de un grupo
    async getGroupAnnouncements(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/announcements`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Crear anuncio
    async createAnnouncement(groupId, announcementData) {
        const response = await fetch(`${API_URL}/groups/${groupId}/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(announcementData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Actualizar anuncio
    async updateAnnouncement(announcementId, updateData) {
        const response = await fetch(`${API_URL}/announcements/${announcementId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar anuncio
    async deleteAnnouncement(announcementId) {
        const response = await fetch(`${API_URL}/announcements/${announcementId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};

export const reportService = {
    // Crear reporte
    async createReport(reportData) {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(reportData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener reportes de un grupo
    async getGroupReports(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/reports`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Resolver reporte
    async resolveReport(reportId, resolution) {
        const response = await fetch(`${API_URL}/reports/${reportId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(resolution)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
