import { forumService } from '../services/forumService.js';
import { obtenerIPDesdeRequest } from '../utils/auditLogger.js';

export const forumController = {
    // RG-002 - Crear hilo
    async createThread(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const threadData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const thread = await forumService.createThread(userId, groupId, threadData, ipAddress);

            res.status(201).json({
                success: true,
                message: 'Hilo creado exitosamente',
                data: thread
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating thread:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el hilo'
            });
        }
    },

    // RG-002 - Crear comentario
    async createComment(req, res) {
        try {
            const userId = req.user.id;
            const { threadId } = req.params;
            const { contenido, id_comentario_padre } = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const comment = await forumService.createComment(userId, threadId, contenido, id_comentario_padre, ipAddress);

            res.status(201).json({
                success: true,
                message: 'Comentario creado exitosamente',
                data: comment
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating comment:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el comentario'
            });
        }
    },

    // RG-002 - Cerrar/abrir hilo
    async toggleThreadStatus(req, res) {
        try {
            const userId = req.user.id;
            const { threadId } = req.params;
            const { close } = req.body; // true para cerrar, false para abrir

            const result = await forumService.toggleThreadStatus(userId, threadId, close);

            res.json({
                success: true,
                message: close ? 'Hilo cerrado exitosamente' : 'Hilo abierto exitosamente',
                data: result
            });
        } catch (error) {
            console.error('[COMMUNITY] Error toggling thread status:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al cambiar el estado del hilo'
            });
        }
    },

    // RG-002 - Eliminar hilo
    async deleteThread(req, res) {
        try {
            const userId = req.user.id;
            const { threadId } = req.params;
            const ipAddress = obtenerIPDesdeRequest(req);

            await forumService.deleteThread(userId, threadId, ipAddress);

            res.json({
                success: true,
                message: 'Hilo eliminado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error deleting thread:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el hilo'
            });
        }
    },

    // RG-002 - Eliminar comentario
    async deleteComment(req, res) {
        try {
            const userId = req.user.id;
            const { commentId } = req.params;
            const ipAddress = obtenerIPDesdeRequest(req);

            await forumService.deleteComment(userId, commentId, ipAddress);

            res.json({
                success: true,
                message: 'Comentario eliminado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error deleting comment:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el comentario'
            });
        }
    },

    // Editar comentario
    async editComment(req, res) {
        try {
            const userId = req.user.id;
            const { commentId } = req.params;
            const { contenido } = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            await forumService.editComment(userId, commentId, contenido, ipAddress);

            res.json({
                success: true,
                message: 'Comentario editado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error editing comment:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al editar el comentario'
            });
        }
    },

    // Obtener detalles de un comentario
    async getCommentDetails(req, res) {
        try {
            const { commentId } = req.params;

            const comment = await forumService.getCommentDetails(commentId);

            res.json({
                success: true,
                data: comment
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting comment details:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el comentario'
            });
        }
    },

    // Obtener hilos de un grupo
    async getGroupThreads(req, res) {
        try {
            const userId = req.user?.id || null;
            const { groupId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const threads = await forumService.getGroupThreads(
                userId, 
                groupId, 
                parseInt(page), 
                parseInt(limit)
            );

            res.json({
                success: true,
                data: threads
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting group threads:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los hilos'
            });
        }
    },

    // Obtener detalles de un hilo
    async getThreadDetails(req, res) {
        try {
            const userId = req.user?.id || null;
            const { threadId } = req.params;

            const thread = await forumService.getThreadDetails(userId, threadId);

            res.json({
                success: true,
                data: thread
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting thread details:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el hilo'
            });
        }
    },

    // Obtener detalles básicos de un hilo por ID (para moderación)
    async getThreadById(req, res) {
        try {
            const { threadId } = req.params;

            const thread = await forumService.getThreadById(threadId);

            res.json({
                success: true,
                data: thread
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting thread by id:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el hilo'
            });
        }
    },

    // Obtener todos los foros de un grupo
    async getGroupForums(req, res) {
        try {
            const userId = req.user?.id || null;
            const { groupId } = req.params;

            const forums = await forumService.getGroupForums(userId, groupId);

            res.json({
                success: true,
                data: forums
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting group forums:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los foros'
            });
        }
    },

    // Crear un nuevo foro en un grupo
    async createForum(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const forumData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const forum = await forumService.createForum(userId, groupId, forumData, ipAddress);

            res.status(201).json({
                success: true,
                message: 'Foro creado exitosamente',
                data: forum
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating forum:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el foro'
            });
        }
    },

    // Cerrar/abrir foro
    async toggleForumStatus(req, res) {
        try {
            const userId = req.user.id;
            const { forumId } = req.params;
            const { close } = req.body;

            const result = await forumService.toggleForumStatus(userId, forumId, close);

            res.json({
                success: true,
                message: close ? 'Foro cerrado exitosamente' : 'Foro abierto exitosamente',
                data: result
            });
        } catch (error) {
            console.error('[COMMUNITY] Error toggling forum status:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al cambiar el estado del foro'
            });
        }
    },

    // Eliminar foro
    async deleteForum(req, res) {
        try {
            const userId = req.user.id;
            const { forumId } = req.params;

            await forumService.deleteForum(userId, forumId);

            res.json({
                success: true,
                message: 'Foro eliminado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error deleting forum:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el foro'
            });
        }
    }
};
