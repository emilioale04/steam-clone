import express from 'express';
import { forumController } from '../controllers/forumController.js';
import { requireAuth, optionalAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Obtener foros de un grupo (puede ser público si el grupo es Open)
router.get('/groups/:groupId/forums', optionalAuth, forumController.getGroupForums);

// Obtener hilos de un grupo (puede ser público si el grupo es Open)
router.get('/groups/:groupId/threads', optionalAuth, forumController.getGroupThreads);

// Obtener detalles de un hilo (puede ser público)
router.get('/threads/:threadId', optionalAuth, forumController.getThreadDetails);

// Obtener detalles de un hilo específico por ID (para moderation)
router.get('/threads/:threadId/details', requireAuth, forumController.getThreadById);

// Obtener detalles de un comentario (para moderation)
router.get('/comments/:commentId', requireAuth, forumController.getCommentDetails);

// Las siguientes rutas requieren autenticación
router.use(requireAuth);

// Crear foro en un grupo (solo Owner)
router.post('/groups/:groupId/forums', forumController.createForum);

// Cerrar/abrir foro (Owner y Moderator)
router.post('/forums/:forumId/toggle', forumController.toggleForumStatus);

// Eliminar foro (Owner y Moderator)
router.delete('/forums/:forumId', forumController.deleteForum);

// Crear hilo
router.post('/groups/:groupId/threads', forumController.createThread);

// Crear comentario
router.post('/threads/:threadId/comments', forumController.createComment);

// Editar comentario
router.put('/comments/:commentId', forumController.editComment);

// Eliminar comentario
router.delete('/comments/:commentId', forumController.deleteComment);

// Cerrar/abrir hilo
router.post('/threads/:threadId/toggle', forumController.toggleThreadStatus);

// Eliminar hilo
router.delete('/threads/:threadId', forumController.deleteThread);

export default router;
