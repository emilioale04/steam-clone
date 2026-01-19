const API_URL = 'http://localhost:3000/api/community';

export const consentService = {
    // Obtener estado de consentimiento
    async getConsent() {
        const response = await fetch(`${API_URL}/consent`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Verificar si tiene consentimiento activo
    async checkConsent() {
        const response = await fetch(`${API_URL}/consent/check`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Otorgar consentimiento
    async grantConsent() {
        const response = await fetch(`${API_URL}/consent/grant`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Revocar consentimiento
    async revokeConsent() {
        const response = await fetch(`${API_URL}/consent/revoke`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
