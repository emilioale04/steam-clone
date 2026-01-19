import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const consentService = {
    /**
     * Obtener el estado de consentimiento de un usuario
     */
    async getConsent(userId) {
        const { data, error } = await supabase
            .from('consentimiento_grupos')
            .select('*')
            .eq('id_perfil', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return data;
    },

    /**
     * Registrar o actualizar consentimiento del usuario
     */
    async grantConsent(userId) {
        const existing = await this.getConsent(userId);

        if (existing) {
            // Actualizar consentimiento existente
            const { data, error } = await supabase
                .from('consentimiento_grupos')
                .update({
                    estado_consentimiento: true,
                    fecha_consentimiento: new Date().toISOString(),
                    fecha_revocacion: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id_perfil', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Crear nuevo consentimiento
            const { data, error } = await supabase
                .from('consentimiento_grupos')
                .insert({
                    id_perfil: userId,
                    estado_consentimiento: true,
                    fecha_consentimiento: new Date().toISOString(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    /**
     * Revocar consentimiento del usuario
     */
    async revokeConsent(userId) {
        const { data, error } = await supabase
            .from('consentimiento_grupos')
            .update({
                estado_consentimiento: false,
                fecha_revocacion: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id_perfil', userId)
            .select()
            .single();

        if (error) throw error;

        // Eliminar al usuario de todos los grupos (soft delete)
        await supabase
            .from('miembros_grupo')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id_perfil', userId)
            .is('deleted_at', null);

        return data;
    },

    /**
     * Verificar si el usuario tiene consentimiento activo
     */
    async hasActiveConsent(userId) {
        const consent = await this.getConsent(userId);
        return consent && consent.estado_consentimiento === true;
    }
};
