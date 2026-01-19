const API_URL = 'http://localhost:3000/api/community';

export const reportService = {
    // Obtener reportes del grupo
    async getGroupReports(groupId) {
        const response = await fetch(`${API_URL}/${groupId}/reports`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Aprobar reporte y banear
    async approveReport(groupId, reportId, action) {
        const response = await fetch(`${API_URL}/${groupId}/reports/${reportId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(action)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Rechazar reporte
    async rejectReport(groupId, reportId, notes) {
        const response = await fetch(`${API_URL}/${groupId}/reports/${reportId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ notes })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Crear nuevo reporte
    async createReport(groupId, reportData) {
        const response = await fetch(`${API_URL}/${groupId}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(reportData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Revocar baneo
    async revokeBan(groupId, userId) {
        const response = await fetch(`${API_URL}/${groupId}/members/${userId}/revoke-ban`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
