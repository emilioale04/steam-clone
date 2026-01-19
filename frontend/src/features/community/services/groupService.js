const API_URL = 'http://localhost:3000/api/community';

export const groupService = {
    // Crear grupo
    async createGroup(groupData) {
        const response = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(groupData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener grupos del usuario
    async getMyGroups() {
        const response = await fetch(`${API_URL}/groups/my-groups`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Buscar grupos
    async searchGroups(searchTerm = '') {
        const url = searchTerm 
            ? `${API_URL}/groups/search?q=${encodeURIComponent(searchTerm)}`
            : `${API_URL}/groups/search`;

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener detalles de un grupo
    async getGroupDetails(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Actualizar grupo
    async updateGroup(groupId, updateData) {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar grupo
    async deleteGroup(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Unirse a un grupo
    async joinGroup(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Abandonar grupo
    async leaveGroup(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/leave`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener miembros del grupo
    async getGroupMembers(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Cambiar rol de miembro
    async updateMemberRole(groupId, memberId, role) {
        const response = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rol: role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Banear/desbanear miembro
    async toggleMemberBan(groupId, memberId, ban = true) {
        const response = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ban })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Invitar usuario
    async inviteUser(groupId, targetUserId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ targetUserId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener solicitudes pendientes
    async getPendingRequests(groupId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/requests`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Aprobar/rechazar solicitud
    async handleJoinRequest(groupId, requestId, approve) {
        const response = await fetch(`${API_URL}/groups/${groupId}/requests/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ approve })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Invitar usuario al grupo
    async inviteUser(groupId, targetUserId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ targetUserId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Expulsar miembro del grupo
    async kickMember(groupId, memberId) {
        const response = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}/kick`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
