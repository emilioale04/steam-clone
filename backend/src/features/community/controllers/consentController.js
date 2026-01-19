import { consentService } from '../services/consentService.js';

export const consentController = {
    // Obtener estado de consentimiento
    async getConsent(req, res) {
        try {
            const userId = req.user.id;
            const consent = await consentService.getConsent(userId);

            res.json({
                success: true,
                data: consent
            });
        } catch (error) {
            console.error('[CONSENT] Error getting consent:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el consentimiento'
            });
        }
    },

    // Otorgar consentimiento
    async grantConsent(req, res) {
        try {
            const userId = req.user.id;
            const consent = await consentService.grantConsent(userId);

            res.json({
                success: true,
                message: 'Consentimiento otorgado exitosamente',
                data: consent
            });
        } catch (error) {
            console.error('[CONSENT] Error granting consent:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al otorgar el consentimiento'
            });
        }
    },

    // Revocar consentimiento
    async revokeConsent(req, res) {
        try {
            const userId = req.user.id;
            const consent = await consentService.revokeConsent(userId);

            res.json({
                success: true,
                message: 'Consentimiento revocado exitosamente. Has sido removido de todos los grupos.',
                data: consent
            });
        } catch (error) {
            console.error('[CONSENT] Error revoking consent:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al revocar el consentimiento'
            });
        }
    },

    // Verificar si tiene consentimiento activo
    async checkConsent(req, res) {
        try {
            const userId = req.user.id;
            const hasConsent = await consentService.hasActiveConsent(userId);

            res.json({
                success: true,
                data: { hasConsent }
            });
        } catch (error) {
            console.error('[CONSENT] Error checking consent:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al verificar el consentimiento'
            });
        }
    }
};
