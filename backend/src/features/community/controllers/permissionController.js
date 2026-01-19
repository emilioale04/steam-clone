import { permissionService } from '../services/permissionService.js';

export const permissionController = {
    /**
     * Obtener permisos de un grupo
     */
    async getGroupPermissions(req, res) {
        try {
            const { groupId } = req.params;
            const userId = req.user?.id;

            const permisos = await permissionService.obtenerPermisosGrupo(groupId);

            // Si hay un usuario autenticado, evaluar qué permisos tiene
            let permisosEvaluados = null;
            if (userId) {
                permisosEvaluados = [];
                for (const permiso of permisos) {
                    const resultado = await permissionService.tienePermiso(userId, groupId, permiso.permiso);
                    permisosEvaluados.push({
                        permiso: permiso.permiso,
                        tienePermiso: resultado.tienePermiso || false
                    });
                }
            }

            res.json({
                success: true,
                data: permisos,
                permisos: permisosEvaluados // Array con evaluación para el usuario actual
            });
        } catch (error) {
            console.error('[PERMISSIONS] Error getting permissions:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener permisos'
            });
        }
    },

    /**
     * Actualizar permisos de un grupo (solo Owner)
     */
    async updateGroupPermissions(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const { permisos } = req.body;

            if (!Array.isArray(permisos) || permisos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un array de permisos para actualizar'
                });
            }

            const resultados = await permissionService.actualizarPermisos(userId, groupId, permisos);

            res.json({
                success: true,
                message: 'Permisos actualizados',
                data: resultados
            });
        } catch (error) {
            console.error('[PERMISSIONS] Error updating permissions:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar permisos'
            });
        }
    },

    /**
     * Resetear permisos a valores por defecto
     */
    async resetGroupPermissions(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;

            const result = await permissionService.resetearPermisos(userId, groupId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('[PERMISSIONS] Error resetting permissions:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al resetear permisos'
            });
        }
    }
};
