import { announcementService } from '../services/announcementService.js';

export const communityController = {
    // RG-007 - Crear anuncio
    async createAnnouncement(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const announcementData = req.body;

            const announcement = await announcementService.createAnnouncement(
                userId, 
                groupId, 
                announcementData
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

            const announcement = await announcementService.updateAnnouncement(
                userId, 
                announcementId, 
                updateData
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
    },

    // Crear reseña
    async createReview(req, res) {
        try {
            const userId = req.user.id;
            const { appId } = req.params;
            const { rating, review } = req.body;

            // Validar rating
            if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating debe ser un número entre 1 y 5'
                });
            }

            // Validar y sanitizar review
            const reviewValidation = validateField('review', review);
            if (!reviewValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: reviewValidation.message
                });
            }

            // Sanitizar review adicionalmente
            const sanitizedReview = sanitizeString(reviewValidation.value);

            // Crear reseña usando Supabase (prepared statements automáticos)
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    user_id: userId,
                    app_id: appId,
                    rating: rating,
                    review: sanitizedReview,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                logger.error('[REVIEW] Error creating review:', error);
                throw error;
            }

            res.status(201).json({
                success: true,
                message: 'Reseña creada exitosamente',
                data: data
            });
        } catch (error) {
            logger.error('[REVIEW] Error creating review:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear la reseña'
            });
        }
    },

    // Obtener reseñas de una app
    async getReviews(req, res) {
        try {
            const { appId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const offset = (page - 1) * limit;

            // Obtener reseñas con información del usuario
            const { data, error, count } = await supabase
                .from('reviews')
                .select(`
                    *,
                    profiles:user_id (
                        username
                    )
                `, { count: 'exact' })
                .eq('app_id', appId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('[REVIEW] Error getting reviews:', error);
                throw error;
            }

            res.json({
                success: true,
                data: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            logger.error('[REVIEW] Error getting reviews:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener las reseñas'
            });
        }
    },

    // Actualizar reseña
    async updateReview(req, res) {
        try {
            const userId = req.user.id;
            const { reviewId } = req.params;
            const { rating, review } = req.body;

            // Validar rating si se proporciona
            if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating debe ser un número entre 1 y 5'
                });
            }

            // Validar y sanitizar review si se proporciona
            let sanitizedReview;
            if (review !== undefined) {
                const reviewValidation = validateField('review', review);
                if (!reviewValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: reviewValidation.message
                    });
                }
                sanitizedReview = sanitizeString(reviewValidation.value);
            }

            // Construir objeto de actualización
            const updateData = {};
            if (rating !== undefined) updateData.rating = rating;
            if (sanitizedReview !== undefined) updateData.review = sanitizedReview;
            updateData.updated_at = new Date().toISOString();

            // Actualizar reseña (solo si pertenece al usuario)
            const { data, error } = await supabase
                .from('reviews')
                .update(updateData)
                .eq('id', reviewId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                logger.error('[REVIEW] Error updating review:', error);
                throw error;
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Reseña no encontrada o no tienes permisos para editarla'
                });
            }

            res.json({
                success: true,
                message: 'Reseña actualizada exitosamente',
                data: data
            });
        } catch (error) {
            logger.error('[REVIEW] Error updating review:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar la reseña'
            });
        }
    },

    // Eliminar reseña
    async deleteReview(req, res) {
        try {
            const userId = req.user.id;
            const { reviewId } = req.params;

            // Eliminar reseña (solo si pertenece al usuario)
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId)
                .eq('user_id', userId);

            if (error) {
                logger.error('[REVIEW] Error deleting review:', error);
                throw error;
            }

            res.json({
                success: true,
                message: 'Reseña eliminada exitosamente'
            });
        } catch (error) {
            logger.error('[REVIEW] Error deleting review:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar la reseña'
            });
        }
    }
};
