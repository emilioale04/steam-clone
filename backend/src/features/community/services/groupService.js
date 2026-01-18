import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const groupService = {
    /**
     * RG-001a - Crear un nuevo grupo
     * Usuario estándar puede crear hasta 10 grupos
     */
    async createGroup(userId, groupData) {
        // Verificar que el usuario es estándar (no limitado)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_limited')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('Perfil no encontrado');
        }

        if (profile.is_limited) {
            throw new Error('Los usuarios limitados no pueden crear grupos. Realiza una compra para activar tu cuenta.');
        }

        // Verificar límite de 10 grupos
        const { count, error: countError } = await supabase
            .from('grupos')
            .select('id', { count: 'exact' })
            .eq('id_creador', userId)
            .is('deleted_at', null);

        if (countError) throw countError;

        if (count >= 10) {
            throw new Error('Has alcanzado el límite de 10 grupos');
        }

        // Validar visibilidad
        const validVisibilities = ['Open', 'Restricted', 'Closed'];
        if (!validVisibilities.includes(groupData.visibilidad)) {
            throw new Error('Visibilidad inválida. Debe ser: Open, Restricted o Closed');
        }

        // Crear el grupo
        const { data: grupo, error: groupError } = await supabase
            .from('grupos')
            .insert({
                nombre: groupData.nombre,
                descripcion: groupData.descripcion || '',
                avatar_url: groupData.avatar_url || null,
                visibilidad: groupData.visibilidad,
                id_creador: userId,
                fecha_creacion: new Date().toISOString(),
                estado: 'activo'
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // Agregar al creador como Owner (miembro)
        const { error: memberError } = await supabase
            .from('miembros_grupo')
            .insert({
                id_grupo: grupo.id,
                id_perfil: userId,
                rol: 'Owner',
                estado_membresia: 'activo',
                fecha_union: new Date().toISOString()
            });

        if (memberError) {
            // Rollback: eliminar el grupo si falla agregar el miembro
            await supabase.from('grupos').delete().eq('id', grupo.id);
            throw memberError;
        }

        return grupo;
    },

    /**
     * RG-001b - Editar grupo (solo Owner)
     */
    async updateGroup(userId, groupId, updateData) {
        // Verificar que el usuario es Owner del grupo
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

        if (member.rol !== 'Owner') {
            throw new Error('Solo el dueño puede editar el grupo');
        }

        // Validar visibilidad si se proporciona
        if (updateData.visibilidad) {
            const validVisibilities = ['Open', 'Restricted', 'Closed'];
            if (!validVisibilities.includes(updateData.visibilidad)) {
                throw new Error('Visibilidad inválida');
            }
        }

        // Actualizar el grupo
        const updateFields = {};
        if (updateData.nombre) updateFields.nombre = updateData.nombre;
        if (updateData.descripcion !== undefined) updateFields.descripcion = updateData.descripcion;
        if (updateData.avatar_url !== undefined) updateFields.avatar_url = updateData.avatar_url;
        if (updateData.visibilidad) updateFields.visibilidad = updateData.visibilidad;
        if (updateData.reglas !== undefined) updateFields.reglas = updateData.reglas;
        updateFields.updated_at = new Date().toISOString();

        const { data: grupo, error: updateError } = await supabase
            .from('grupos')
            .update(updateFields)
            .eq('id', groupId)
            .is('deleted_at', null)
            .select()
            .single();

        if (updateError) throw updateError;

        return grupo;
    },

    /**
     * RG-001c - Unirse a un grupo
     */
    async joinGroup(userId, groupId) {
        // Verificar que el usuario es estándar
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_limited')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('Perfil no encontrado');
        }

        if (profile.is_limited) {
            throw new Error('Los usuarios limitados no pueden unirse a grupos');
        }

        // Obtener información del grupo
        const { data: grupo, error: groupError } = await supabase
            .from('grupos')
            .select('visibilidad, estado')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        if (groupError || !grupo) {
            throw new Error('Grupo no encontrado');
        }

        if (grupo.estado !== 'activo') {
            throw new Error('Este grupo no está activo');
        }

        // Verificar si ya es miembro (incluyendo registros eliminados)
        const { data: existingMember } = await supabase
            .from('miembros_grupo')
            .select('id, estado_membresia, deleted_at')
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId)
            .single();

        if (existingMember && !existingMember.deleted_at) {
            if (existingMember.estado_membresia === 'activo') {
                throw new Error('Ya eres miembro de este grupo');
            }
            if (existingMember.estado_membresia === 'baneado') {
                throw new Error('Has sido baneado de este grupo');
            }
        }

        // Si el usuario fue baneado previamente, no puede volver a unirse
        if (existingMember && existingMember.estado_membresia === 'baneado') {
            throw new Error('Has sido baneado de este grupo');
        }

        // Lógica según visibilidad
        if (grupo.visibilidad === 'Open') {
            // Si existe un registro eliminado, restaurarlo; si no, crear uno nuevo
            if (existingMember && existingMember.deleted_at) {
                const { error: updateError } = await supabase
                    .from('miembros_grupo')
                    .update({
                        deleted_at: null,
                        rol: 'Member',
                        estado_membresia: 'activo',
                        fecha_union: new Date().toISOString()
                    })
                    .eq('id', existingMember.id);

                if (updateError) throw updateError;
            } else {
                const { error: joinError } = await supabase
                    .from('miembros_grupo')
                    .insert({
                        id_grupo: groupId,
                        id_perfil: userId,
                        rol: 'Member',
                        estado_membresia: 'activo',
                        fecha_union: new Date().toISOString()
                    });

                if (joinError) throw joinError;
            }
            return { success: true, status: 'joined' };
        } else if (grupo.visibilidad === 'Restricted' || grupo.visibilidad === 'Closed') {
            // Verificar si tiene invitación pendiente
            const { data: invitation } = await supabase
                .from('invitaciones_solicitudes')
                .select('*')
                .eq('id_grupo', groupId)
                .eq('id_usuario_destino', userId)
                .eq('tipo', 'invitacion')
                .eq('estado', 'pendiente')
                .is('deleted_at', null)
                .single();

            if (invitation) {
                // Aceptar la invitación y unirse
                await supabase
                    .from('invitaciones_solicitudes')
                    .update({
                        estado: 'aceptada',
                        fecha_resolucion: new Date().toISOString()
                    })
                    .eq('id', invitation.id);

                // Si existe un registro eliminado, restaurarlo; si no, crear uno nuevo
                if (existingMember && existingMember.deleted_at) {
                    await supabase
                        .from('miembros_grupo')
                        .update({
                            deleted_at: null,
                            rol: 'Member',
                            estado_membresia: 'activo',
                            fecha_union: new Date().toISOString()
                        })
                        .eq('id', existingMember.id);
                } else {
                    await supabase
                        .from('miembros_grupo')
                        .insert({
                            id_grupo: groupId,
                            id_perfil: userId,
                            rol: 'Member',
                            estado_membresia: 'activo',
                            fecha_union: new Date().toISOString()
                        });
                }

                return { success: true, status: 'joined' };
            }

            // Si es Closed, no puede solicitar unirse
            if (grupo.visibilidad === 'Closed') {
                throw new Error('Este grupo es privado. Necesitas una invitación para unirte');
            }

            // Si es Restricted, crear solicitud
            const { error: requestError } = await supabase
                .from('invitaciones_solicitudes')
                .insert({
                    id_grupo: groupId,
                    id_usuario_origen: userId,
                    id_usuario_destino: null, // Solicitud al grupo
                    tipo: 'solicitud',
                    estado: 'pendiente',
                    fecha_solicitud: new Date().toISOString()
                });

            if (requestError) throw requestError;
            return { success: true, status: 'requested' };
        }
    },

    /**
     * RG-001c - Abandonar grupo
     * RG-008 - Herencia de grupo si el Owner abandona
     */
    async leaveGroup(userId, groupId) {
        // Verificar membresía
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

        // Si es Owner, transferir propiedad
        if (member.rol === 'Owner') {
            await this.transferOwnership(groupId, userId);
        }

        // Eliminar del grupo
        await supabase
            .from('miembros_grupo')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId);

        // RG-006 - Verificar si el grupo quedó sin miembros
        const { count } = await supabase
            .from('miembros_grupo')
            .select('id', { count: 'exact' })
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null);

        if (count === 0) {
            // Eliminar el grupo automáticamente
            await supabase
                .from('grupos')
                .update({ deleted_at: new Date().toISOString(), estado: 'eliminado' })
                .eq('id', groupId);
        }

        return { success: true };
    },

    /**
     * RG-008 - Transferir propiedad del grupo
     */
    async transferOwnership(groupId, currentOwnerId) {
        // Buscar el siguiente en la jerarquía
        const { data: candidates, error: candidatesError } = await supabase
            .from('miembros_grupo')
            .select('id_perfil, rol, fecha_union')
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'activo')
            .neq('id_perfil', currentOwnerId)
            .is('deleted_at', null)
            .order('rol', { ascending: true }) // Moderator antes que Member
            .order('fecha_union', { ascending: true }); // Más antiguo primero

        if (candidatesError) throw candidatesError;

        if (candidates && candidates.length > 0) {
            const newOwner = candidates[0];

            // Degradar al Owner actual a Member
            await supabase
                .from('miembros_grupo')
                .update({ rol: 'Member' })
                .eq('id_grupo', groupId)
                .eq('id_perfil', currentOwnerId);

            // Promover al nuevo Owner
            await supabase
                .from('miembros_grupo')
                .update({ rol: 'Owner' })
                .eq('id_grupo', groupId)
                .eq('id_perfil', newOwner.id_perfil);

            return newOwner.id_perfil;
        }

        return null;
    },

    /**
     * RG-006 - Cambiar rol de un miembro (solo Owner)
     */
    async updateMemberRole(requesterId, groupId, targetUserId, newRole) {
        // Verificar que el requester es Owner
        const { data: requester, error: requesterError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', requesterId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (requesterError || !requester || requester.rol !== 'Owner') {
            throw new Error('Solo el dueño puede cambiar roles');
        }

        // Validar nuevo rol
        const validRoles = ['Moderator', 'Member'];
        if (!validRoles.includes(newRole)) {
            throw new Error('Rol inválido');
        }

        // No se puede cambiar el rol del Owner
        if (targetUserId === requesterId) {
            throw new Error('No puedes cambiar tu propio rol como Owner');
        }

        // Actualizar rol
        const { error: updateError } = await supabase
            .from('miembros_grupo')
            .update({ rol: newRole })
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null);

        if (updateError) throw updateError;

        return { success: true };
    },

    /**
     * RG-006 - Banear/desbanear miembro (Owner y Moderator)
     */
    async banMember(requesterId, groupId, targetUserId, isBan = true, isPermanent = true, days = null) {
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
            throw new Error('No tienes permisos para banear miembros');
        }

        // No se puede banear al Owner
        const { data: target } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .single();

        if (target && target.rol === 'Owner') {
            throw new Error('No se puede banear al dueño del grupo');
        }

        // Banear o desbanear
        if (isBan) {
            const updateData = { 
                estado_membresia: 'baneado',
                updated_at: new Date().toISOString()
            };

            // Si es temporal, calcular fecha de fin del baneo
            if (!isPermanent && days) {
                const banEndDate = new Date();
                banEndDate.setDate(banEndDate.getDate() + days);
                updateData.fecha_fin_baneo = banEndDate.toISOString();
            } else {
                // Si es permanente, asegurarse de que no hay fecha de fin
                updateData.fecha_fin_baneo = null;
            }

            const { error: updateError } = await supabase
                .from('miembros_grupo')
                .update(updateData)
                .eq('id_grupo', groupId)
                .eq('id_perfil', targetUserId);

            if (updateError) throw updateError;
        } else {
            // Desbanear
            const { error: updateError } = await supabase
                .from('miembros_grupo')
                .update({ 
                    estado_membresia: 'activo',
                    fecha_fin_baneo: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id_grupo', groupId)
                .eq('id_perfil', targetUserId);

            if (updateError) throw updateError;
        }

        return { success: true };
    },

    /**
     * Aprobar/rechazar solicitud de unión (Owner y Moderator)
     */
    async handleJoinRequest(requesterId, groupId, requestId, approve) {
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
            throw new Error('No tienes permisos para gestionar solicitudes');
        }

        // Obtener la solicitud
        const { data: request, error: requestError } = await supabase
            .from('invitaciones_solicitudes')
            .select('*')
            .eq('id', requestId)
            .eq('id_grupo', groupId)
            .eq('tipo', 'solicitud')
            .eq('estado', 'pendiente')
            .single();

        if (requestError || !request) {
            throw new Error('Solicitud no encontrada');
        }

        // Actualizar solicitud
        const newStatus = approve ? 'aceptada' : 'rechazada';
        await supabase
            .from('invitaciones_solicitudes')
            .update({
                estado: newStatus,
                fecha_resolucion: new Date().toISOString()
            })
            .eq('id', requestId);

        // Si se aprueba, agregar como miembro
        if (approve) {
            await supabase
                .from('miembros_grupo')
                .insert({
                    id_grupo: groupId,
                    id_perfil: request.id_usuario_origen,
                    rol: 'Member',
                    estado_membresia: 'activo',
                    fecha_union: new Date().toISOString()
                });
        }

        return { success: true };
    },

    /**
     * Invitar usuario al grupo (Miembros pueden invitar en grupos Open)
     */
    async inviteUser(requesterId, groupId, targetUserId) {
        // Verificar que el requester es miembro
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

        // Verificar visibilidad del grupo
        const { data: grupo } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        // En grupos Closed, solo Owner y Moderator pueden invitar
        if (grupo.visibilidad === 'Closed' && 
            requester.rol !== 'Owner' && requester.rol !== 'Moderator') {
            throw new Error('Solo el dueño y moderadores pueden invitar en grupos privados');
        }

        // Verificar que el target es usuario estándar
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('is_limited')
            .eq('id', targetUserId)
            .single();

        if (!targetProfile) {
            throw new Error('Usuario no encontrado');
        }

        if (targetProfile.is_limited) {
            throw new Error('No puedes invitar a usuarios limitados');
        }

        // Verificar que no es miembro ya
        const { data: existingMember } = await supabase
            .from('miembros_grupo')
            .select('*')
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .is('deleted_at', null)
            .single();

        if (existingMember) {
            throw new Error('Este usuario ya es miembro del grupo');
        }

        // Crear invitación
        const { error: inviteError } = await supabase
            .from('invitaciones_solicitudes')
            .insert({
                id_grupo: groupId,
                id_usuario_origen: requesterId,
                id_usuario_destino: targetUserId,
                tipo: 'invitacion',
                estado: 'pendiente',
                fecha_solicitud: new Date().toISOString()
            });

        if (inviteError) throw inviteError;

        return { success: true };
    },

    /**
     * Obtener grupos del usuario
     */
    async getUserGroups(userId) {
        const { data: memberships, error } = await supabase
            .from('miembros_grupo')
            .select(`
                id,
                rol,
                estado_membresia,
                fecha_union,
                grupos (
                    id,
                    nombre,
                    descripcion,
                    avatar_url,
                    visibilidad,
                    estado,
                    fecha_creacion
                )
            `)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .order('fecha_union', { ascending: false });

        if (error) throw error;

        return memberships || [];
    },

    /**
     * Obtener detalles de un grupo
     */
    async getGroupDetails(userId, groupId) {
        // Obtener información del grupo
        const { data: grupo, error: groupError } = await supabase
            .from('grupos')
            .select('*')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        if (groupError || !grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Verificar si el usuario es miembro
        let userMembership = null;
        if (userId) {
            const { data: membership } = await supabase
                .from('miembros_grupo')
                .select('rol, estado_membresia')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .is('deleted_at', null)
                .single();

            userMembership = membership;
        }

        // Contar miembros
        const { count: memberCount } = await supabase
            .from('miembros_grupo')
            .select('id', { count: 'exact' })
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null);

        return {
            ...grupo,
            member_count: memberCount || 0,
            user_membership: userMembership
        };
    },

    /**
     * Obtener miembros de un grupo
     */
    async getGroupMembers(userId, groupId) {
        // Verificar que el usuario puede ver los miembros
        const { data: grupo } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        if (!grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Si el grupo es Closed o Restricted, verificar membresía
        if (grupo.visibilidad !== 'Open' && userId) {
            const { data: membership } = await supabase
                .from('miembros_grupo')
                .select('id')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .eq('estado_membresia', 'activo')
                .is('deleted_at', null)
                .single();

            if (!membership) {
                throw new Error('No tienes acceso a ver los miembros de este grupo');
            }
        }

        // Obtener miembros
        const { data: members, error } = await supabase
            .from('miembros_grupo')
            .select(`
                id,
                rol,
                estado_membresia,
                fecha_union,
                profiles (
                    id,
                    username
                )
            `)
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .order('rol', { ascending: true })
            .order('fecha_union', { ascending: true });

        if (error) throw error;

        return members || [];
    },

    /**
     * Buscar grupos públicos
     */
    async searchGroups(searchTerm, userId = null) {
        let query = supabase
            .from('grupos')
            .select('id, nombre, descripcion, avatar_url, visibilidad, fecha_creacion')
            .is('deleted_at', null)
            .eq('estado', 'activo');

        // Si hay término de búsqueda
        if (searchTerm) {
            query = query.or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
        }

        const { data: grupos, error } = await query
            .order('fecha_creacion', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Agregar conteo de miembros a cada grupo
        const groupsWithCounts = await Promise.all(
            (grupos || []).map(async (grupo) => {
                const { count } = await supabase
                    .from('miembros_grupo')
                    .select('id', { count: 'exact' })
                    .eq('id_grupo', grupo.id)
                    .eq('estado_membresia', 'activo')
                    .is('deleted_at', null);

                return {
                    ...grupo,
                    member_count: count || 0
                };
            })
        );

        return groupsWithCounts;
    }
};
