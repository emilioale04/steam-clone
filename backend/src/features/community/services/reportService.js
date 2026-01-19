import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { 
    registrarRevocarBaneo,
    registrarReportarForo,
    registrarReportarHilo,
    registrarReportarComentario,
    obtenerIPDesdeRequest
} from '../utils/auditLogger.js';

export const reportService = {
    /**
     * Obtener reportes pendientes de un grupo (solo Owner y Moderator)
     */
    async getGroupReports(requesterId, groupId) {
        // Verificar permisos
        const { data: requester, error: requesterError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', requesterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (requesterError || !requester) {
            throw new Error('No eres miembro de este grupo');
        }

        if (requester.rol !== 'Owner' && requester.rol !== 'Moderator') {
            throw new Error('No tienes permisos para ver reportes');
        }

        // Primero, actualizar baneos expirados antes de obtener los reportes
        await this.updateExpiredBans(groupId);

        // Obtener reportes del grupo
        const { data: reports, error } = await supabase
            .from('reportes_comunidad')
            .select('*')
            .eq('id_grupo', groupId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Obtener perfiles de usuarios relacionados manualmente
        if (reports && reports.length > 0) {
            const userIds = new Set();
            reports.forEach(report => {
                if (report.id_reportante) userIds.add(report.id_reportante);
                if (report.id_reportado) userIds.add(report.id_reportado);
                if (report.id_administrador_revisor) userIds.add(report.id_administrador_revisor);
            });

            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', Array.from(userIds));

            if (profilesError) {
                console.error('[REPORTS] Error fetching profiles:', profilesError);
            }

            // Verificar qué IDs no se encontraron
            if (profiles) {
                const foundIds = new Set(profiles.map(p => p.id));
                const missingIds = Array.from(userIds).filter(id => !foundIds.has(id));
                if (missingIds.length > 0) {
                    console.warn('[REPORTS] Missing profile IDs:', missingIds);
                }
            }

            const profileMap = {};
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p;
                });
            }

            // Agregar perfiles a los reportes
            reports.forEach(report => {
                report.reportante = profileMap[report.id_reportante] || { id: report.id_reportante, username: 'Usuario eliminado' };
                report.reportado = profileMap[report.id_reportado] || { id: report.id_reportado, username: 'Usuario eliminado' };
                report.revisor = profileMap[report.id_administrador_revisor] || null;
            });
        }

        return reports || [];
    },

    /**
     * Aprobar reporte y aplicar sanción
     */
    async approveReport(requesterId, groupId, reportId, action) {
        const { banType, duration, durationType } = action;

        // Verificar permisos
        const { data: requester, error: requesterError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', requesterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (requesterError || !requester) {
            throw new Error('No eres miembro de este grupo');
        }

        if (requester.rol !== 'Owner' && requester.rol !== 'Moderator') {
            throw new Error('No tienes permisos para aprobar reportes');
        }

        // Obtener el reporte
        const { data: report, error: reportError } = await supabase
            .from('reportes_comunidad')
            .select('*')
            .eq('id', reportId)
            .eq('id_grupo', groupId)
            .single();

        if (reportError || !report) {
            throw new Error('Reporte no encontrado');
        }

        if (report.estado !== 'pendiente') {
            throw new Error('Este reporte ya fue procesado');
        }

        // Verificar que el objetivo no sea Owner
        const { data: target } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', report.id_reportado)
            .single();

        if (target && target.rol === 'Owner') {
            throw new Error('No se puede banear al dueño del grupo');
        }

        // Calcular fecha de fin de baneo si es temporal
        let banEndDate = null;
        if (banType === 'temporal' && duration) {
            banEndDate = new Date();
            switch (durationType) {
                case 'minutes':
                    banEndDate.setMinutes(banEndDate.getMinutes() + duration);
                    break;
                case 'hours':
                    banEndDate.setHours(banEndDate.getHours() + duration);
                    break;
                case 'days':
                    banEndDate.setDate(banEndDate.getDate() + duration);
                    break;
                default:
                    banEndDate.setMinutes(banEndDate.getMinutes() + duration);
            }
            banEndDate = banEndDate.toISOString();
        }

        // Actualizar estado del miembro a baneado
        const { error: banError } = await supabase
            .from('miembros_grupo')
            .update({
                estado_membresia: 'baneado',
                fecha_fin_baneo: banEndDate,
                updated_at: new Date().toISOString()
            })
            .eq('id_grupo', groupId)
            .eq('id_perfil', report.id_reportado);

        if (banError) throw banError;

        // Actualizar reporte como resuelto
        let notasAdmin = '';
        if (banType === 'permanente') {
            notasAdmin = 'Baneado permanentemente';
        } else {
            const banDate = new Date(banEndDate);
            notasAdmin = `Baneado temporalmente hasta ${banDate.toLocaleString('es-ES', { 
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })} UTC`;
        }

        const { error: updateError } = await supabase
            .from('reportes_comunidad')
            .update({
                estado: 'resuelto',
                notas_admin: notasAdmin,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (updateError) throw updateError;

        return { 
            success: true, 
            message: `Usuario baneado ${banType === 'permanente' ? 'permanentemente' : 'temporalmente'}` 
        };
    },

    /**
     * Rechazar reporte
     */
    async rejectReport(requesterId, groupId, reportId, notes) {
        // Verificar permisos
        const { data: requester, error: requesterError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', requesterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (requesterError || !requester) {
            throw new Error('No eres miembro de este grupo');
        }

        if (requester.rol !== 'Owner' && requester.rol !== 'Moderator') {
            throw new Error('No tienes permisos para rechazar reportes');
        }

        // Obtener el reporte
        const { data: report, error: reportError } = await supabase
            .from('reportes_comunidad')
            .select('*')
            .eq('id', reportId)
            .eq('id_grupo', groupId)
            .single();

        if (reportError || !report) {
            throw new Error('Reporte no encontrado');
        }

        if (report.estado !== 'pendiente') {
            throw new Error('Este reporte ya fue procesado');
        }

        // Actualizar reporte como rechazado
        const { error: updateError } = await supabase
            .from('reportes_comunidad')
            .update({
                estado: 'rechazado',
                notas_admin: notes || 'Reporte rechazado',
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (updateError) throw updateError;

        return { success: true, message: 'Reporte rechazado' };
    },

    /**
     * Crear un nuevo reporte
     */
    async createReport(reporterId, groupId, reportData, ipAddress = null) {
        const { targetId, targetType, reason, contentId, contentPreview } = reportData;

        // Verificar que el reportero es miembro del grupo
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('id')
            .eq('id_grupo', groupId)
            .eq('id_perfil', reporterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('Debes ser miembro del grupo para reportar');
        }

        // No permitir reportarse a sí mismo (excepto para foros que no tienen autor)
        if (targetId && reporterId === targetId) {
            throw new Error('No puedes reportarte a ti mismo');
        }

        // Verificar que no existe un reporte pendiente igual
        let query = supabase
            .from('reportes_comunidad')
            .select('id')
            .eq('id_grupo', groupId)
            .eq('id_reportante', reporterId)
            .eq('tipo_objetivo', targetType)
            .eq('estado', 'pendiente')
            .is('deleted_at', null);
        
        if (targetId) {
            query = query.eq('id_reportado', targetId);
        } else {
            query = query.is('id_reportado', null);
        }
        
        const { data: existingReport } = await query.single();

        if (existingReport) {
            throw new Error('Ya tienes un reporte pendiente para este elemento');
        }

        // Construir el motivo con el contenido
        const fullReason = contentPreview 
            ? `${reason}\n[Contenido: ${contentPreview}]`
            : reason;

        // Crear el reporte
        const { data: newReport, error: createError } = await supabase
            .from('reportes_comunidad')
            .insert({
                id_grupo: groupId,
                id_reportante: reporterId,
                id_reportado: targetId, // ID del usuario reportado
                id_objetivo: contentId, // ID del contenido (comentario/hilo/foro)
                tipo_objetivo: targetType,
                motivo: fullReason,
                estado: 'pendiente',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) throw createError;

        // Registrar log según el tipo de reporte
        if (targetType === 'foro') {
            await registrarReportarForo(reporterId, groupId, contentId, reason, ipAddress);
        } else if (targetType === 'hilo') {
            await registrarReportarHilo(reporterId, groupId, contentId, reason, ipAddress);
        } else if (targetType === 'comentario') {
            await registrarReportarComentario(reporterId, groupId, contentId, reason, ipAddress);
        }

        return newReport;
    },

    /**
     * Revocar baneo de un usuario
     */
    async revokeBan(requesterId, groupId, userId, ipAddress = null) {
        // Verificar permisos del solicitante
        const { data: requester, error: requesterError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', requesterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (requesterError || !requester) {
            throw new Error('No eres miembro de este grupo');
        }

        if (requester.rol !== 'Owner' && requester.rol !== 'Moderator') {
            throw new Error('No tienes permisos para revocar baneos');
        }

        // Verificar que el usuario está baneado
        const { data: bannedUser, error: banError } = await supabase
            .from('miembros_grupo')
            .select('estado_membresia')
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId)
            .single();

        if (banError || !bannedUser) {
            throw new Error('Usuario no encontrado en el grupo');
        }

        if (bannedUser.estado_membresia !== 'baneado') {
            throw new Error('Este usuario no está baneado');
        }

        // Revocar el baneo
        const { error: updateError } = await supabase
            .from('miembros_grupo')
            .update({
                estado_membresia: 'activo',
                fecha_fin_baneo: null,
                updated_at: new Date().toISOString()
            })
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId);

        if (updateError) throw updateError;

        // Registrar log de auditoría
        await registrarRevocarBaneo(requesterId, groupId, userId, ipAddress);

        return { 
            success: true, 
            message: 'Baneo revocado exitosamente' 
        };
    },

    /**
     * Actualizar baneos expirados automáticamente
     */
    async updateExpiredBans(groupId) {
        const now = new Date();
        // Buscar miembros baneados con fecha de expiración
        const { data: bannedMembers, error: fetchError } = await supabase
            .from('miembros_grupo')
            .select('id_perfil, fecha_fin_baneo')
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'baneado')
            .not('fecha_fin_baneo', 'is', null);

        // Verificar cuáles han expirado
        const expiredMembers = bannedMembers.filter(member => {
            const banEndDate = new Date(member.fecha_fin_baneo);
            const isExpired = now >= banEndDate;
            return isExpired;
        });

        if (expiredMembers.length === 0) {
            return;
        }

        console.log('[BAN UPDATE] Baneos expirados a actualizar:', expiredMembers.length);

        // Actualizar todos los baneos expirados
        const userIds = expiredMembers.map(m => m.id_perfil);
        const { error: updateError } = await supabase
            .from('miembros_grupo')
            .update({
                estado_membresia: 'activo',
                fecha_fin_baneo: null,
                updated_at: now.toISOString()
            })
            .eq('id_grupo', groupId)
            .in('id_perfil', userIds);

        if (updateError) {
            console.error('[BAN UPDATE] Error al actualizar baneos:', updateError);
        } else {
            console.log('[BAN UPDATE] ✅ Baneos actualizados exitosamente');
        }
    }
};
