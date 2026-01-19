import express from 'express';
import { groupController } from '../controllers/groupController.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Grupos del usuario
router.get('/my-groups', groupController.getUserGroups);

// Crear grupo
router.post('/', groupController.createGroup);

// Buscar grupos
router.get('/search', groupController.searchGroups);

// Buscar usuarios para invitar
router.get('/users/search', groupController.searchUsers);

// Detalles de un grupo (puede ser público)
router.get('/:groupId', groupController.getGroupDetails);

// Editar grupo
router.put('/:groupId', groupController.updateGroup);

// Eliminar grupo
router.delete('/:groupId', groupController.deleteGroup);

// Unirse a un grupo
router.post('/:groupId/join', groupController.joinGroup);

// Abandonar grupo
router.post('/:groupId/leave', groupController.leaveGroup);

// Miembros del grupo
router.get('/:groupId/members', groupController.getGroupMembers);

// Cambiar rol de miembro
router.put('/:groupId/members/:memberId/role', groupController.updateMemberRole);

// Banear/desbanear miembro
router.post('/:groupId/members/:memberId/ban', groupController.banMember);

// Invitar usuario
router.post('/:groupId/invite', groupController.inviteUser);

// Obtener solicitudes de unión pendientes
router.get('/:groupId/requests', groupController.getPendingRequests);

// Gestionar solicitudes de unión (aprobar/rechazar)
router.post('/:groupId/requests/:requestId', groupController.handleJoinRequest);

export default router;
