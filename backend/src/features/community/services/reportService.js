import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const reportService = {
    /**
     * RG-003 - Crear reporte
     */
    async createReport(userId, reportData) {
        // Verificar que el usuario es miembro del grupo (si aplica)
        if (reportData.id_grupo) {
            const { data: member, error: memberError } = await supabase
                .from('miembros_grupo')
                .select('id')
                .eq('id_grupo', reportData.id_grupo)
                .eq('id_perfil', userId)
                .eq('estado_membresia', 'activo')
                .is('deleted_at', null)
                .single();

            if (memberError || !member) {
                throw new Error('No eres miembro de este grupo');
            }
        }

        // Validar tipo de objetivo
        const validTypes = ['perfil', 'hilo', 'comentario', 'grupo'];
        if (!validTypes.includes(reportData.tipo_objetivo)) {
            throw new Error('Tipo de objetivo inválido');
        }

        // Crear reporte
        const { data: report, error: reportError } = await supabase
            .from('reportes_comunidad')
            .insert({
                id_reportante: userId,
                id_objetivo: reportData.id_objetivo,
                tipo_objetivo: reportData.tipo_objetivo,
                motivo: reportData.motivo,
                estado: 'pendiente'
            })
            .select()
            .single();

        if (reportError) throw reportError;

        return report;
    },

    /**
     * Obtener reportes de un grupo (Owner y Moderator)
     */
    async getGroupReports(userId, groupId) {
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
            throw new Error('No tienes permisos para ver reportes');
        }

        // Obtener reportes relacionados con el grupo
        // Esto incluye reportes de hilos y comentarios del grupo
        const { data: foro } = await supabase
            .from('foros')
            .select('id')
            .eq('id_grupo', groupId)
            .is('deleted_at', null)
            .single();

        if (!foro) {
            return [];
        }

        // Obtener IDs de hilos del grupo
        const { data: threads } = await supabase
            .from('hilos')
            .select('id')
            .eq('id_foro', foro.id)
            .is('deleted_at', null);

        const threadIds = (threads || []).map(t => t.id);

        // Obtener reportes de hilos
        const { data: threadReports } = await supabase
            .from('reportes_comunidad')
            .select(`
                id,
                motivo,
                estado,
                created_at,
                tipo_objetivo,
                id_objetivo,
                profiles!reportes_comunidad_id_reportante_fkey (
                    id,
                    username
                )
            `)
            .in('id_objetivo', threadIds)
            .eq('tipo_objetivo', 'hilo')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        // Obtener reportes de comentarios
        const { data: commentReports } = await supabase
            .from('reportes_comunidad')
            .select(`
                id,
                motivo,
                estado,
                created_at,
                tipo_objetivo,
                id_objetivo,
                profiles!reportes_comunidad_id_reportante_fkey (
                    id,
                    username
                )
            `)
            .eq('tipo_objetivo', 'comentario')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        // Filtrar comentarios que pertenecen a hilos del grupo
        const filteredCommentReports = [];
        if (commentReports && commentReports.length > 0) {
            for (const report of commentReports) {
                const { data: comment } = await supabase
                    .from('comentarios')
                    .select('id_hilo')
                    .eq('id', report.id_objetivo)
                    .single();

                if (comment && threadIds.includes(comment.id_hilo)) {
                    filteredCommentReports.push(report);
                }
            }
        }

        // Combinar todos los reportes
        const allReports = [
            ...(threadReports || []),
            ...filteredCommentReports
        ];

        return allReports;
    },

    /**
     * Resolver reporte (para moderadores del grupo)
     */
    async resolveReport(userId, reportId, resolution) {
        // Obtener el reporte
        const { data: report, error: reportError } = await supabase
            .from('reportes_comunidad')
            .select('*')
            .eq('id', reportId)
            .is('deleted_at', null)
            .single();

        if (reportError || !report) {
            throw new Error('Reporte no encontrado');
        }

        // Determinar el grupo según el tipo de objetivo
        let groupId = null;

        if (report.tipo_objetivo === 'hilo') {
            const { data: thread } = await supabase
                .from('hilos')
                .select(`
                    foros (
                        id_grupo
                    )
                `)
                .eq('id', report.id_objetivo)
                .single();

            groupId = thread?.foros?.id_grupo;
        } else if (report.tipo_objetivo === 'comentario') {
            const { data: comment } = await supabase
                .from('comentarios')
                .select(`
                    hilos (
                        foros (
                            id_grupo
                        )
                    )
                `)
                .eq('id', report.id_objetivo)
                .single();

            groupId = comment?.hilos?.foros?.id_grupo;
        }

        if (!groupId) {
            throw new Error('No se puede determinar el grupo del reporte');
        }

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
            throw new Error('No tienes permisos para resolver reportes');
        }

        // Actualizar reporte
        const { error: updateError } = await supabase
            .from('reportes_comunidad')
            .update({
                estado: resolution.estado, // 'resuelto', 'rechazado', etc.
                notas_admin: resolution.notas || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (updateError) throw updateError;

        return { success: true };
    }
};
