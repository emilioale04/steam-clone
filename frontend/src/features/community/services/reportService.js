const API_URL = 'http://localhost:3000/api/community/reports';

export const reportService = {
    // Crear un reporte
    async createReport(reportData) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(reportData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener reportes de un grupo (Owner y Moderator)
    async getGroupReports(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Resolver reporte (Owner y Moderator)
    async resolveReport(reportId, resolution) {
        const response = await fetch(`${API_URL}/${reportId}/resolve`, {
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
