import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

/**
 * Tipos de permisos disponibles
 */
export const PERMISOS = {
    EDITAR_METADATOS: 'editar_metadatos',
    EXPULSAR_MIEMBROS: 'expulsar_miembros',
    INVITAR_MIEMBROS: 'invitar_miembros',
    ADMINISTRAR_SOLICITUDES: 'administrar_solicitudes',
    BANEAR_USUARIO: 'banear_usuario'
};

/**
 * Permisos que son configurables
 */
const PERMISOS_CONFIGURABLES = {
    [PERMISOS.EDITAR_METADATOS]: { moderator: true, member: true },
    [PERMISOS.EXPULSAR_MIEMBROS]: { moderator: true, member: false },
    [PERMISOS.INVITAR_MIEMBROS]: { moderator: true, member: true },
    [PERMISOS.ADMINISTRAR_SOLICITUDES]: { moderator: true, member: false },
    [PERMISOS.BANEAR_USUARIO]: { moderator: false, member: false } // No configurable
};

/**
 * Permisos por defecto al crear un grupo
 */
const PERMISOS_POR_DEFECTO = {
    [PERMISOS.EDITAR_METADATOS]: { owner: true, moderator: false, member: false },
    [PERMISOS.EXPULSAR_MIEMBROS]: { owner: true, moderator: false, member: false },
    [PERMISOS.INVITAR_MIEMBROS]: { owner: true, moderator: false, member: false },
    [PERMISOS.ADMINISTRAR_SOLICITUDES]: { owner: true, moderator: false, member: false },
    [PERMISOS.BANEAR_USUARIO]: { owner: true, moderator: true, member: false }
};

export const permissionService = {
    /**
     * Verificar si un usuario tiene un permiso específico en un grupo
     */
    async tienePermiso(userId, groupId, permiso) {
        try {
            // Obtener el rol del usuario en el grupo
            const { data: member, error: memberError } = await supabase
                .from('miembros_grupo')
                .select('rol')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .eq('estado_membresia', 'activo')
                .is('deleted_at', null)
                .single();

            if (memberError || !member) {
                return { tienePermiso: false, error: 'No eres miembro de este grupo' };
            }

            const rol = member.rol;

            // Obtener la configuración de permisos del grupo
            const { data: permisoConfig, error: permisoError } = await supabase
                .from('permisos_grupo')
                .select('owner, moderator, member')
                .eq('id_grupo', groupId)
                .eq('permiso', permiso)
                .single();

            if (permisoError) {
                // Si no existe configuración, usar permisos por defecto
                const defaultConfig = PERMISOS_POR_DEFECTO[permiso];
                if (!defaultConfig) {
                    return { tienePermiso: false, error: 'Permiso no válido' };
                }

                const tienePermiso = defaultConfig[rol.toLowerCase()] || false;
                return { tienePermiso, rol };
            }

            // Verificar según el rol
            let tienePermiso = false;
            if (rol === 'Owner') {
                tienePermiso = permisoConfig.owner;
            } else if (rol === 'Moderator') {
                tienePermiso = permisoConfig.moderator;
            } else if (rol === 'Member') {
                tienePermiso = permisoConfig.member;
            }

            return { tienePermiso, rol };
        } catch (error) {
            console.error('[PERMISSIONS] Error verificando permiso:', error);
            return { tienePermiso: false, error: 'Error al verificar permisos' };
        }
    },

    /**
     * Obtener todos los permisos de un grupo
     */
    async obtenerPermisosGrupo(groupId) {
        const { data: permisos, error } = await supabase
            .from('permisos_grupo')
            .select('*')
            .eq('id_grupo', groupId)
            .order('permiso', { ascending: true });

        if (error) throw error;

        // Si no hay permisos, retornar los por defecto
        if (!permisos || permisos.length === 0) {
            return Object.entries(PERMISOS_POR_DEFECTO).map(([permiso, config]) => ({
                permiso,
                ...config,
                configurable: PERMISOS_CONFIGURABLES[permiso]
            }));
        }

        // Agregar información sobre qué es configurable
        return permisos.map(p => ({
            ...p,
            configurable: PERMISOS_CONFIGURABLES[p.permiso] || { moderator: false, member: false }
        }));
    },

    /**
     * Actualizar permisos de un grupo (solo Owner)
     */
    async actualizarPermisos(ownerId, groupId, permisosActualizar) {
        // Verificar que el usuario es Owner
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', ownerId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member || member.rol !== 'Owner') {
            throw new Error('Solo el dueño del grupo puede modificar permisos');
        }

        // Validar y actualizar cada permiso
        const resultados = [];
        for (const update of permisosActualizar) {
            const { permiso, moderator, member: memberPerm } = update;

            // Verificar que el permiso existe
            if (!PERMISOS_CONFIGURABLES[permiso]) {
                resultados.push({ permiso, error: 'Permiso no válido' });
                continue;
            }

            // Verificar que el cambio es configurable
            const configurable = PERMISOS_CONFIGURABLES[permiso];
            const updateFields = { updated_at: new Date().toISOString() };

            if (moderator !== undefined && configurable.moderator) {
                updateFields.moderator = moderator;
            }

            if (memberPerm !== undefined && configurable.member) {
                updateFields.member = memberPerm;
            }

            // Si no hay nada que actualizar, continuar
            if (Object.keys(updateFields).length === 1) { // solo updated_at
                resultados.push({ permiso, error: 'No hay cambios configurables' });
                continue;
            }

            // Actualizar en la base de datos
            const { error: updateError } = await supabase
                .from('permisos_grupo')
                .update(updateFields)
                .eq('id_grupo', groupId)
                .eq('permiso', permiso);

            if (updateError) {
                resultados.push({ permiso, error: updateError.message });
            } else {
                resultados.push({ permiso, success: true });
            }
        }

        return resultados;
    },

    /**
     * Resetear permisos de un grupo a los valores por defecto
     */
    async resetearPermisos(ownerId, groupId) {
        // Verificar que el usuario es Owner
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', ownerId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member || member.rol !== 'Owner') {
            throw new Error('Solo el dueño del grupo puede resetear permisos');
        }

        // Actualizar cada permiso a los valores por defecto
        for (const [permiso, config] of Object.entries(PERMISOS_POR_DEFECTO)) {
            await supabase
                .from('permisos_grupo')
                .update({
                    owner: config.owner,
                    moderator: config.moderator,
                    member: config.member,
                    updated_at: new Date().toISOString()
                })
                .eq('id_grupo', groupId)
                .eq('permiso', permiso);
        }

        return { success: true, message: 'Permisos reseteados a valores por defecto' };
    }
};
