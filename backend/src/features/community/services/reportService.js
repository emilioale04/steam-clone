import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

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
                if (report.id_objetivo) userIds.add(report.id_objetivo);
                if (report.id_administrador_revisor) userIds.add(report.id_administrador_revisor);
            });

            const { data: profiles } = await supabase
                .from('perfiles')
                .select('id, username')
                .in('id', Array.from(userIds));

            const profileMap = {};
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p;
                });
            }

            // Agregar perfiles a los reportes
            reports.forEach(report => {
                report.reportante = profileMap[report.id_reportante] || null;
                report.objetivo = profileMap[report.id_objetivo] || null;
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
            .eq('id_perfil', report.id_objetivo)
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
            .eq('id_perfil', report.id_objetivo);

        if (banError) throw banError;

        // Actualizar reporte como aprobado
        const { error: updateError } = await supabase
            .from('reportes_comunidad')
            .update({
                estado: 'aprobado',
                id_administrador_revisor: requesterId,
                notas_admin: `Baneado ${banType === 'permanente' ? 'permanentemente' : `temporalmente hasta ${banEndDate}`}`,
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
                id_administrador_revisor: requesterId,
                notas_admin: notes || 'Reporte rechazado',
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (updateError) throw updateError;

        return { success: true, message: 'Reporte rechazado' };
    }
};
