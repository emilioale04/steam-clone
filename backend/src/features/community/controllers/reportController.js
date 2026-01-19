import { reportService } from '../services/reportService.js';
import { obtenerIPDesdeRequest } from '../utils/auditLogger.js';

export const reportController = {
    // Obtener reportes del grupo
    async getGroupReports(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;

            const reports = await reportService.getGroupReports(userId, groupId);

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            console.error('[REPORTS] Error getting reports:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener reportes'
            });
        }
    },

    // Aprobar reporte y banear usuario
    async approveReport(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, reportId } = req.params;
            const action = req.body;

            const result = await reportService.approveReport(userId, groupId, reportId, action);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('[REPORTS] Error approving report:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al aprobar reporte'
            });
        }
    },

    // Rechazar reporte
    async rejectReport(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, reportId } = req.params;
            const { notes } = req.body;

            const result = await reportService.rejectReport(userId, groupId, reportId, notes);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('[REPORTS] Error rejecting report:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al rechazar reporte'
            });
        }
    },

    // Crear nuevo reporte
    async createReport(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const reportData = req.body;
            const ipAddress = obtenerIPDesdeRequest(req);

            const report = await reportService.createReport(userId, groupId, reportData, ipAddress);

            res.status(201).json({
                success: true,
                data: report,
                message: 'Reporte creado exitosamente'
            });
        } catch (error) {
            console.error('[REPORTS] Error creating report:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear reporte'
            });
        }
    },

    // Revocar baneo de usuario
    async revokeBan(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, userId: bannedUserId } = req.params;
            const ipAddress = obtenerIPDesdeRequest(req);

            const result = await reportService.revokeBan(userId, groupId, bannedUserId, ipAddress);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('[REPORTS] Error revoking ban:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al revocar baneo'
            });
        }
    }
};
