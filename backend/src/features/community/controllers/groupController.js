import { groupService } from '../services/groupService.js';
import { obtenerIPDesdeRequest } from '../utils/auditLogger.js';

export const groupController = {
    // RG-001a - Crear grupo
    async createGroup(req, res) {
        try {
            const userId = req.user.id;
            const groupData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const grupo = await groupService.createGroup(userId, groupData, ipAddress);

            res.status(201).json({
                success: true,
                message: 'Grupo creado exitosamente',
                data: grupo
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating group:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el grupo'
            });
        }
    },

    // RG-001b - Editar grupo
    async updateGroup(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const updateData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const grupo = await groupService.updateGroup(userId, groupId, updateData, ipAddress);

            res.json({
                success: true,
                message: 'Grupo actualizado exitosamente',
                data: grupo
            });
        } catch (error) {
            console.error('[COMMUNITY] Error updating group:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el grupo'
            });
        }
    },

    // RG-001d - Eliminar grupo (solo Owner)
    async deleteGroup(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const ipAddress = obtenerIPDesdeRequest(req);

            await groupService.deleteGroup(userId, groupId, ipAddress);

            res.json({
                success: true,
                message: 'Grupo eliminado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error deleting group:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el grupo'
            });
        }
    },

    // RG-001c - Unirse a grupo
    async joinGroup(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;

            const result = await groupService.joinGroup(userId, groupId);

            res.json({
                success: true,
                message: result.status === 'joined' 
                    ? 'Te has unido al grupo exitosamente' 
                    : 'Solicitud enviada. Espera la aprobación de los moderadores',
                data: result
            });
        } catch (error) {
            console.error('[COMMUNITY] Error joining group:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al unirse al grupo'
            });
        }
    },

    // RG-001c - Abandonar grupo
    async leaveGroup(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;

            await groupService.leaveGroup(userId, groupId);

            res.json({
                success: true,
                message: 'Has abandonado el grupo'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error leaving group:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al abandonar el grupo'
            });
        }
    },

    // RG-006 - Cambiar rol de miembro
    async updateMemberRole(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, memberId } = req.params;
            const { rol } = req.body;

            await groupService.updateMemberRole(userId, groupId, memberId, rol);

            res.json({
                success: true,
                message: 'Rol actualizado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error updating member role:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el rol'
            });
        }
    },

    // RG-006 - Banear/desbanear miembro
    async banMember(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, memberId } = req.params;
            const { ban, isPermanent, days } = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            await groupService.banMember(userId, groupId, memberId, ban, isPermanent, days, ipAddress);

            res.json({
                success: true,
                message: ban ? 'Miembro baneado exitosamente' : 'Baneo removido exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error banning member:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al banear el miembro'
            });
        }
    },

    // Gestionar solicitudes de unión
    async handleJoinRequest(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, requestId } = req.params;
            const { approve } = req.body;

            await groupService.handleJoinRequest(userId, groupId, requestId, approve);

            res.json({
                success: true,
                message: approve ? 'Solicitud aprobada' : 'Solicitud rechazada'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error handling join request:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar la solicitud'
            });
        }
    },

    // Invitar usuario
    async inviteUser(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const { targetUserId } = req.body;

            await groupService.inviteUser(userId, groupId, targetUserId);

            res.json({
                success: true,
                message: 'Invitación enviada exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error inviting user:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al enviar la invitación'
            });
        }
    },

    // Obtener grupos del usuario
    async getUserGroups(req, res) {
        try {
            const userId = req.user.id;

            const groups = await groupService.getUserGroups(userId);

            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting user groups:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los grupos'
            });
        }
    },

    // Obtener detalles de un grupo
    async getGroupDetails(req, res) {
        try {
            const userId = req.user?.id || null;
            const { groupId } = req.params;

            const group = await groupService.getGroupDetails(userId, groupId);

            res.json({
                success: true,
                data: group
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting group details:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los detalles del grupo'
            });
        }
    },

    // Obtener miembros de un grupo
    async getGroupMembers(req, res) {
        try {
            const userId = req.user?.id || null;
            const { groupId } = req.params;

            const members = await groupService.getGroupMembers(userId, groupId);

            res.json({
                success: true,
                data: members
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting group members:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los miembros'
            });
        }
    },

    // Buscar grupos
    async searchGroups(req, res) {
        try {
            const userId = req.user?.id || null;
            const { q } = req.query;

            const groups = await groupService.searchGroups(q, userId);

            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('[COMMUNITY] Error searching groups:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar grupos'
            });
        }
    },

    // Obtener solicitudes pendientes de un grupo
    async getPendingRequests(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;

            const requests = await groupService.getPendingRequests(userId, groupId);

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting pending requests:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener las solicitudes'
            });
        }
    },

    // Buscar usuarios para invitar
    async searchUsers(req, res) {
        try {
            const { q } = req.query;

            const users = await groupService.searchUsersToInvite(q);

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('[COMMUNITY] Error searching users:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al buscar usuarios'
            });
        }
    }
};
