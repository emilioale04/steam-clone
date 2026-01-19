import { supabaseAdmin as supabase } from '../config/supabase.js';

export const notificationController = {
    // Obtener notificaciones del usuario
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 50, onlyUnread = false } = req.query;

            let query = supabase
                .from('notificaciones')
                .select('*')
                .eq('id_usuario', userId)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (onlyUnread === 'true') {
                query = query.eq('leido', false);
            }

            const { data: notifications, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data: notifications || []
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error getting notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones'
            });
        }
    },

    // Marcar notificación como leída
    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            // Verificar que la notificación pertenece al usuario
            const { data: notification, error: notifError } = await supabase
                .from('notificaciones')
                .select('id_usuario')
                .eq('id', notificationId)
                .single();

            if (notifError || !notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notificación no encontrada'
                });
            }

            if (notification.id_usuario !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para modificar esta notificación'
                });
            }

            // Marcar como leída
            const { error: updateError } = await supabase
                .from('notificaciones')
                .update({ 
                    leido: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', notificationId);

            if (updateError) throw updateError;

            res.json({
                success: true,
                message: 'Notificación marcada como leída'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marking as read:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar notificación como leída'
            });
        }
    },

    // Marcar todas como leídas
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;

            const { error } = await supabase
                .from('notificaciones')
                .update({ 
                    leido: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id_usuario', userId)
                .eq('leido', false);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Todas las notificaciones marcadas como leídas'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marking all as read:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar todas las notificaciones como leídas'
            });
        }
    },

    // Eliminar notificación
    async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            // Verificar que la notificación pertenece al usuario
            const { data: notification, error: notifError } = await supabase
                .from('notificaciones')
                .select('id_usuario')
                .eq('id', notificationId)
                .single();

            if (notifError || !notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notificación no encontrada'
                });
            }

            if (notification.id_usuario !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para eliminar esta notificación'
                });
            }

            // Eliminar
            const { error: deleteError } = await supabase
                .from('notificaciones')
                .delete()
                .eq('id', notificationId);

            if (deleteError) throw deleteError;

            res.json({
                success: true,
                message: 'Notificación eliminada'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar notificación'
            });
        }
    }
};
