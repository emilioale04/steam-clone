import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const announcementService = {
    /**
     * RG-007 - Crear anuncio (Owner y Moderator)
     */
    async createAnnouncement(userId, groupId, announcementData) {
        // Verificar permisos
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        if (member.rol !== 'Owner' && member.rol !== 'Moderator') {
            throw new Error('Solo el dueño y moderadores pueden crear anuncios');
        }

        // Crear anuncio
        const { data: announcement, error: announcementError } = await supabase
            .from('anuncios_grupo')
            .insert({
                id_grupo: groupId,
                id_autor: userId,
                titulo: announcementData.titulo,
                contenido: announcementData.contenido,
                fecha_publicacion: announcementData.fecha_publicacion || new Date().toISOString(),
                fecha_expiracion: announcementData.fecha_expiracion || null,
                activo: true
            })
            .select()
            .single();

        if (announcementError) throw announcementError;

        // TODO: Aquí se debería enviar notificaciones a todos los miembros
        // Por ahora solo retornamos el anuncio creado
        
        return announcement;
    },

    /**
     * Editar anuncio (Owner y Moderator)
     */
    async updateAnnouncement(userId, announcementId, updateData) {
        // Obtener el anuncio y verificar permisos
        const { data: announcement, error: announcementError } = await supabase
            .from('anuncios_grupo')
            .select(`
                id,
                id_grupo,
                id_autor
            `)
            .eq('id', announcementId)
            .is('deleted_at', null)
            .single();

        if (announcementError || !announcement) {
            throw new Error('Anuncio no encontrado');
        }

        // Verificar permisos
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', announcement.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        // Solo el autor o el Owner pueden editar
        if (announcement.id_autor !== userId && member.rol !== 'Owner') {
            throw new Error('No tienes permisos para editar este anuncio');
        }

        // Actualizar
        const updateFields = {};
        if (updateData.titulo) updateFields.titulo = updateData.titulo;
        if (updateData.contenido) updateFields.contenido = updateData.contenido;
        if (updateData.fecha_expiracion !== undefined) updateFields.fecha_expiracion = updateData.fecha_expiracion;
        if (updateData.activo !== undefined) updateFields.activo = updateData.activo;
        updateFields.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await supabase
            .from('anuncios_grupo')
            .update(updateFields)
            .eq('id', announcementId)
            .select()
            .single();

        if (updateError) throw updateError;

        return updated;
    },

    /**
     * Eliminar anuncio (Owner y Moderator)
     */
    async deleteAnnouncement(userId, announcementId) {
        // Obtener el anuncio
        const { data: announcement, error: announcementError } = await supabase
            .from('anuncios_grupo')
            .select(`
                id,
                id_grupo,
                id_autor
            `)
            .eq('id', announcementId)
            .is('deleted_at', null)
            .single();

        if (announcementError || !announcement) {
            throw new Error('Anuncio no encontrado');
        }

        // Verificar permisos
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', announcement.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        if (member.rol !== 'Owner' && member.rol !== 'Moderator') {
            throw new Error('No tienes permisos para eliminar anuncios');
        }

        // Soft delete
        await supabase
            .from('anuncios_grupo')
            .update({ deleted_at: new Date().toISOString(), activo: false })
            .eq('id', announcementId);

        return { success: true };
    },

    /**
     * Obtener anuncios activos de un grupo
     */
    async getGroupAnnouncements(userId, groupId) {
        // Verificar acceso al grupo
        const { data: grupo } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Si no es Open, verificar membresía
        if (grupo.visibilidad !== 'Open') {
            if (!userId) {
                throw new Error('Debes iniciar sesión para ver este grupo');
            }

            const { data: member } = await supabase
                .from('miembros_grupo')
                .select('id')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .eq('estado_membresia', 'activo')
                .is('deleted_at', null)
                .single();

            if (!member) {
                throw new Error('No tienes acceso a este grupo');
            }
        }

        // Obtener anuncios activos
        const now = new Date().toISOString();
        const { data: announcements, error } = await supabase
            .from('anuncios_grupo')
            .select(`
                id,
                titulo,
                contenido,
                fecha_publicacion,
                fecha_expiracion,
                profiles!anuncios_grupo_id_autor_fkey (
                    id,
                    username
                )
            `)
            .eq('id_grupo', groupId)
            .eq('activo', true)
            .is('deleted_at', null)
            .or(`fecha_expiracion.is.null,fecha_expiracion.gte.${now}`)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        return announcements || [];
    }
};
