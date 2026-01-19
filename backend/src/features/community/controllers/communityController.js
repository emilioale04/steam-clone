import { announcementService } from '../services/announcementService.js';
import { obtenerIPDesdeRequest } from '../utils/auditLogger.js';

export const communityController = {
    // RG-007 - Crear anuncio
    async createAnnouncement(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const announcementData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const announcement = await announcementService.createAnnouncement(
                userId, 
                groupId, 
                announcementData,
                ipAddress
            );

            res.status(201).json({
                success: true,
                message: 'Anuncio creado exitosamente',
                data: announcement
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating announcement:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el anuncio'
            });
        }
    },

    // Editar anuncio
    async updateAnnouncement(req, res) {
        try {
            const userId = req.user.id;
            const { announcementId } = req.params;
            const updateData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const announcement = await announcementService.updateAnnouncement(
                userId, 
                announcementId, 
                updateData,
                ipAddress
            );

            res.json({
                success: true,
                message: 'Anuncio actualizado exitosamente',
                data: announcement
            });
        } catch (error) {
            console.error('[COMMUNITY] Error updating announcement:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el anuncio'
            });
        }
    },

    // Eliminar anuncio
    async deleteAnnouncement(req, res) {
        try {
            const userId = req.user.id;
            const { announcementId } = req.params;

            await announcementService.deleteAnnouncement(userId, announcementId);

            res.json({
                success: true,
                message: 'Anuncio eliminado exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error deleting announcement:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el anuncio'
            });
        }
    },

    // Obtener anuncios de un grupo
    async getGroupAnnouncements(req, res) {
        try {
            const userId = req.user?.id || null;
            const { groupId } = req.params;

            const announcements = await announcementService.getGroupAnnouncements(
                userId, 
                groupId
            );

            res.json({
                success: true,
                data: announcements
            });
        } catch (error) {
            console.error('[COMMUNITY] Error getting announcements:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los anuncios'
            });
        }
    }
};
