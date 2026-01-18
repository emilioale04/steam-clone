const API_URL = 'http://localhost:3000/api/community/forum';

export const forumService = {
    // Obtener foros de un grupo
    async getGroupForums(groupId) {
        const response = await fetch(
            `${API_URL}/groups/${groupId}/forums`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Crear un nuevo foro
    async createForum(groupId, forumData) {
        const response = await fetch(`${API_URL}/groups/${groupId}/forums`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(forumData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener hilos de un grupo
    async getGroupThreads(groupId, page = 1, limit = 20) {
        const response = await fetch(
            `${API_URL}/groups/${groupId}/threads?page=${page}&limit=${limit}`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Obtener detalles de un hilo
    async getThreadDetails(threadId) {
        const response = await fetch(`${API_URL}/threads/${threadId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Crear hilo
    async createThread(groupId, threadData) {
        const response = await fetch(`${API_URL}/groups/${groupId}/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(threadData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Crear comentario
    async createComment(threadId, contenido, parentId = null) {
        const response = await fetch(`${API_URL}/threads/${threadId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ contenido, id_comentario_padre: parentId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Editar comentario
    async editComment(commentId, contenido) {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ contenido })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar comentario
    async deleteComment(commentId) {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Cerrar/abrir hilo
    async toggleThreadStatus(threadId, close = true) {
        const response = await fetch(`${API_URL}/threads/${threadId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ close })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar hilo
    async deleteThread(threadId) {
        const response = await fetch(`${API_URL}/threads/${threadId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Cerrar/abrir foro
    async toggleForumStatus(forumId, close = true) {
        const response = await fetch(`${API_URL}/forums/${forumId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ close })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Eliminar foro
    async deleteForum(forumId) {
        const response = await fetch(`${API_URL}/forums/${forumId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};
