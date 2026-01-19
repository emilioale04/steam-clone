import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { notificationService } from '../../../shared/services/notificationService.js';
import { 
    registrarCrearAnuncio,
    registrarFijarAnuncio,
    registrarDesfijarAnuncio
} from '../utils/auditLogger.js';

/**
 * Helper: Verificar si un usuario está baneado del grupo
 */
async function checkUserBanStatus(userId, groupId) {
    if (!userId) return { isBanned: false };

    const { data: member } = await supabase
        .from('miembros_grupo')
        .select('estado_membresia, fecha_fin_baneo')
        .eq('id_grupo', groupId)
        .eq('id_perfil', userId)
        .is('deleted_at', null)
        .single();

    if (!member) return { isBanned: false };

    // Verificar si el baneo ha expirado
    if (member.estado_membresia === 'baneado' && member.fecha_fin_baneo) {
        const banEndDate = new Date(member.fecha_fin_baneo);
        const now = new Date();
        
        if (now >= banEndDate) {
            // Baneo expirado, actualizar
            await supabase
                .from('miembros_grupo')
                .update({
                    estado_membresia: 'activo',
                    fecha_fin_baneo: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId);
            
            return { isBanned: false };
        }
    }

    return { 
        isBanned: member.estado_membresia === 'baneado',
        member 
    };
}

export const announcementService = {
    /**
     * RG-007 - Crear anuncio (Owner y Moderator)
     */
    async createAnnouncement(userId, groupId, announcementData, ipAddress = null) {
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

        // Si se va a fijar, primero desfijar todos los demás
        if (announcementData.fijado) {
            await supabase
                .from('anuncios_grupo')
                .update({ fijado: false })
                .eq('id_grupo', groupId)
                .eq('fijado', true);
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
                fijado: announcementData.fijado || false,
                activo: true
            })
            .select()
            .single();

        if (announcementError) throw announcementError;

        // Registrar log de auditoría
        await registrarCrearAnuncio(userId, groupId, announcement.id, announcementData.fijado || false, ipAddress);

        // Enviar notificaciones a todos los miembros del grupo
        await notificationService.notifyGroupAnnouncement(groupId, announcement.id, userId);
        
        return announcement;
    },

    /**
     * Editar anuncio (Owner y Moderator)
     */
    async updateAnnouncement(userId, announcementId, updateData, ipAddress = null) {
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
        if (updateData.fijado !== undefined) {
            // Si se va a fijar, primero desfijar todos los demás
            if (updateData.fijado === true) {
                await supabase
                    .from('anuncios_grupo')
                    .update({ fijado: false })
                    .eq('id_grupo', announcement.id_grupo)
                    .eq('fijado', true)
                    .neq('id', announcementId);
            }
            updateFields.fijado = updateData.fijado;
        }
        updateFields.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await supabase
            .from('anuncios_grupo')
            .update(updateFields)
            .eq('id', announcementId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Registrar logs de auditoría para fijar/desfijar
        if (updateData.fijado === true) {
            await registrarFijarAnuncio(userId, announcement.id_grupo, announcementId, ipAddress);
        } else if (updateData.fijado === false) {
            await registrarDesfijarAnuncio(userId, announcement.id_grupo, announcementId, ipAddress);
        }

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
        // Primero, marcar anuncios expirados como inactivos
        const now = new Date().toISOString();
        await supabase
            .from('anuncios_grupo')
            .update({
                activo: false,
                fijado: false,
                deleted_at: now
            })
            .eq('id_grupo', groupId)
            .eq('activo', true)
            .not('fecha_expiracion', 'is', null)
            .lt('fecha_expiracion', now);

        // Verificar acceso al grupo
        const { data: grupo } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .eq('estado', 'activo')
            .is('deleted_at', null)
            .single();

        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Verificar si el usuario está baneado (incluso en grupos Open)
        const { isBanned } = await checkUserBanStatus(userId, groupId);
        if (isBanned) {
            throw new Error('Has sido baneado de este grupo');
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

        // Obtener anuncios activos (no expirados ni eliminados)
        const { data: announcements, error } = await supabase
            .from('anuncios_grupo')
            .select(`
                id,
                titulo,
                contenido,
                fecha_publicacion,
                fecha_expiracion,
                fijado,
                profiles!anuncios_grupo_id_autor_fkey (
                    id,
                    username
                )
            `)
            .eq('id_grupo', groupId)
            .eq('activo', true)
            .is('deleted_at', null)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        return announcements || [];
    }
};
