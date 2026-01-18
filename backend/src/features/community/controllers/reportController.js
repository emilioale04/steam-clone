import { reportService } from '../services/reportService.js';

export const reportController = {
    // RG-003 - Crear reporte
    async createReport(req, res) {
        try {
            const userId = req.user.id;
            const reportData = req.body;

            const report = await reportService.createReport(userId, reportData);

            res.status(201).json({
                success: true,
                message: 'Reporte creado exitosamente',
                data: report
            });
        } catch (error) {
            console.error('[COMMUNITY] Error creating report:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el reporte'
            });
        }
    },

    // Obtener reportes del grupo (Owner y Moderator)
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
            console.error('[COMMUNITY] Error getting group reports:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener los reportes'
            });
        }
    },

    // Resolver reporte (Owner y Moderator)
    async resolveReport(req, res) {
        try {
            const userId = req.user.id;
            const { reportId } = req.params;
            const resolution = req.body;

            await reportService.resolveReport(userId, reportId, resolution);

            res.json({
                success: true,
                message: 'Reporte resuelto exitosamente'
            });
        } catch (error) {
            console.error('[COMMUNITY] Error resolving report:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al resolver el reporte'
            });
        }
    }
};
