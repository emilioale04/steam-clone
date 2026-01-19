import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';
import { notificationService } from '../../../shared/services/notificationService.js';
import { consentService } from './consentService.js';
import { permissionService, PERMISOS } from './permissionService.js';
import { 
    registrarCrearGrupo, 
    registrarEliminarGrupo, 
    registrarActualizarGrupo,
    registrarBanearUsuario,
    registrarDesbanearUsuario,
    registrarAgregarMiembro,
    registrarExpulsarMiembro,
    registrarCambiarRangoMiembro,
    registrarModificarReglas,
    registrarConfigurarMetadatos
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

export const groupService = {
    /**
     * RG-001a - Crear un nuevo grupo
     * Usuario estándar puede crear hasta 10 grupos
     */
    async createGroup(userId, groupData, ipAddress = null) {
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

        // Registrar log de auditoría
        await registrarCrearGrupo(
            userId,
            grupo.id,
            grupo.nombre,
            grupo.visibilidad,
            ipAddress
        );

        return grupo;
    },

    /**
     * RG-001b - Editar grupo (solo Owner)
     */
    async updateGroup(userId, groupId, updateData, ipAddress = null) {
        // Verificar permiso de editar metadatos
        const { tienePermiso, error: permisoError } = await permissionService.tienePermiso(
            userId, 
            groupId, 
            PERMISOS.EDITAR_METADATOS
        );

        if (permisoError || !tienePermiso) {
            throw new Error(permisoError || 'No tienes permisos para editar este grupo');
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

        // Registrar logs de auditoría específicos
        if (updateData.reglas !== undefined) {
            await registrarModificarReglas(userId, groupId, ipAddress);
        }

        // Configurar metadatos (nombre, descripción, avatar, visibilidad)
        const metadataFields = ['nombre', 'descripcion', 'avatar_url', 'visibilidad'].filter(f => updateData[f] !== undefined);
        if (metadataFields.length > 0) {
            await registrarConfigurarMetadatos(userId, groupId, metadataFields, ipAddress);
        }

        // Registrar log general de actualización
        await registrarActualizarGrupo(
            userId,
            groupId,
            Object.keys(updateFields).filter(k => k !== 'updated_at'),
            ipAddress
        );

        return grupo;
    },

    /**
     * RG-001d - Eliminar grupo (solo Owner)
     */
    async deleteGroup(userId, groupId, ipAddress = null) {
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
            throw new Error('Solo el dueño puede eliminar el grupo');
        }

        // Obtener información del grupo antes de eliminarlo
        const { data: grupoInfo } = await supabase
            .from('grupos')
            .select('nombre, visibilidad')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        // Soft delete del grupo
        const { error: deleteError } = await supabase
            .from('grupos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', groupId)
            .is('deleted_at', null);

        if (deleteError) throw deleteError;

        // También hacer soft delete de todos los miembros del grupo
        await supabase
            .from('miembros_grupo')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_grupo', groupId)
            .is('deleted_at', null);

        // Registrar log de auditoría
        await registrarEliminarGrupo(
            userId,
            groupId,
            grupoInfo?.nombre || 'Desconocido',
            grupoInfo?.visibilidad || 'Desconocido',
            ipAddress
        );

        return { success: true };
    },

    /**
     * RG-001c - Unirse a un grupo
     */
    async joinGroup(userId, groupId, ipAddress = null) {
        // Verificar consentimiento activo
        const hasConsent = await consentService.hasActiveConsent(userId);
        if (!hasConsent) {
            throw new Error('CONSENT_REQUIRED');
        }

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

            // Registrar log de auditoría
            await registrarAgregarMiembro(userId, groupId, userId, 'Member', ipAddress);

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

                // Registrar log de auditoría
                await registrarAgregarMiembro(userId, groupId, userId, 'Member', ipAddress);

                return { success: true, status: 'joined' };
            }

            // Si es Closed, no puede solicitar unirse
            if (grupo.visibilidad === 'Closed') {
                throw new Error('Este grupo es privado. Necesitas una invitación para unirte');
            }

            // Si es Restricted, verificar si ya tiene una solicitud pendiente
            const { data: existingRequest } = await supabase
                .from('invitaciones_solicitudes')
                .select('id')
                .eq('id_grupo', groupId)
                .eq('id_usuario_origen', userId)
                .eq('tipo', 'solicitud')
                .eq('estado', 'pendiente')
                .is('deleted_at', null)
                .single();

            if (existingRequest) {
                return { success: true, status: 'pending', message: 'Ya tienes una solicitud pendiente para este grupo' };
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

        // Contar cuántos miembros activos hay antes de salir
        const { count: memberCountBefore } = await supabase
            .from('miembros_grupo')
            .select('id', { count: 'exact' })
            .eq('id_grupo', groupId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null);

        // Si es Owner y hay otros miembros, transferir propiedad
        if (member.rol === 'Owner' && memberCountBefore > 1) {
            await this.transferOwnership(groupId, userId);
        }

        // Eliminar del grupo
        const { error: deleteMemberError } = await supabase
            .from('miembros_grupo')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId);

        if (deleteMemberError) {
            console.error('[GROUP] Error removing member:', deleteMemberError);
            throw new Error('Error al abandonar el grupo');
        }

        // Si era el único miembro, eliminar el grupo automáticamente
        if (memberCountBefore === 1) {
            const timestamp = new Date().toISOString();
            const { error: deleteGroupError } = await supabase
                .from('grupos')
                .update({ 
                    deleted_at: timestamp,
                    estado: 'inactivo',
                    updated_at: timestamp
                })
                .eq('id', groupId)
                .is('deleted_at', null);

            if (deleteGroupError) {
                console.error('[GROUP] Error marking group as inactive:', deleteGroupError);
                throw new Error('Error al desactivar el grupo');
            }

            console.log(`[GROUP] Group ${groupId} marked as inactive (no members left)`);
        }

        return { success: true };
    },

    /**
     * RG-008 - Transferir propiedad del grupo
     */
    async transferOwnership(groupId, currentOwnerId) {
        // Buscar primero Moderators (por antigüedad)
        const { data: moderators, error: moderatorError } = await supabase
            .from('miembros_grupo')
            .select('id_perfil, rol, fecha_union')
            .eq('id_grupo', groupId)
            .eq('rol', 'Moderator')
            .eq('estado_membresia', 'activo')
            .neq('id_perfil', currentOwnerId)
            .is('deleted_at', null)
            .order('fecha_union', { ascending: true }); // Más antiguo primero

        if (moderatorError) throw moderatorError;

        // Si hay moderadores, elegir el más antiguo
        if (moderators && moderators.length > 0) {
            const newOwner = moderators[0];

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

            console.log(`[GROUP] Ownership transferred from ${currentOwnerId} to Moderator ${newOwner.id_perfil}`);
            return newOwner.id_perfil;
        }

        // Si no hay moderadores, buscar Members (por antigüedad)
        const { data: members, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('id_perfil, rol, fecha_union')
            .eq('id_grupo', groupId)
            .eq('rol', 'Member')
            .eq('estado_membresia', 'activo')
            .neq('id_perfil', currentOwnerId)
            .is('deleted_at', null)
            .order('fecha_union', { ascending: true }); // Más antiguo primero

        if (memberError) throw memberError;

        // Si hay miembros, elegir el más antiguo
        if (members && members.length > 0) {
            const newOwner = members[0];

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

            console.log(`[GROUP] Ownership transferred from ${currentOwnerId} to Member ${newOwner.id_perfil}`);
            return newOwner.id_perfil;
        }

        return null;
    },

    /**
     * RG-006 - Cambiar rol de un miembro (solo Owner)
     */
    async updateMemberRole(requesterId, groupId, targetUserId, newRole, ipAddress = null) {
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

        // Obtener rol actual antes de actualizar
        const { data: targetMember } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        const rolAnterior = targetMember?.rol || 'Member';

        // Actualizar rol
        const { error: updateError } = await supabase
            .from('miembros_grupo')
            .update({ rol: newRole })
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null);

        if (updateError) throw updateError;

        // Registrar log de auditoría
        await registrarCambiarRangoMiembro(requesterId, groupId, targetUserId, rolAnterior, newRole, ipAddress);

        return { success: true };
    },

    /**
     * RG-006 - Banear/desbanear miembro (Owner y Moderator)
     */
    async banMember(requesterId, groupId, targetUserId, isBan = true, isPermanent = true, days = null, ipAddress = null) {
        // Verificar permiso de banear usuario
        const { tienePermiso, error: permisoError } = await permissionService.tienePermiso(
            requesterId,
            groupId,
            PERMISOS.BANEAR_USUARIO
        );

        if (permisoError || !tienePermiso) {
            throw new Error(permisoError || 'No tienes permisos para banear miembros');
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

            // Registrar log de auditoría
            await registrarBanearUsuario(
                requesterId,
                groupId,
                targetUserId,
                isPermanent,
                days,
                ipAddress
            );
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

            // Registrar log de auditoría
            await registrarDesbanearUsuario(
                requesterId,
                groupId,
                targetUserId,
                ipAddress
            );
        }

        return { success: true };
    },

    /**
     * Expulsar miembro del grupo (solo Owner y Moderator)
     */
    async kickMember(requesterId, groupId, targetUserId, ipAddress = null) {
        // Verificar permiso de expulsar miembros
        const { tienePermiso, rol, error: permisoError } = await permissionService.tienePermiso(
            requesterId,
            groupId,
            PERMISOS.EXPULSAR_MIEMBROS
        );

        if (permisoError || !tienePermiso) {
            throw new Error(permisoError || 'No tienes permisos para expulsar miembros');
        }

        // Obtener información del miembro objetivo
        const { data: target, error: targetError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (targetError || !target) {
            throw new Error('El usuario no es miembro activo de este grupo');
        }

        // No se puede expulsar al Owner
        if (target.rol === 'Owner') {
            throw new Error('No se puede expulsar al dueño del grupo');
        }

        // Moderadores solo pueden expulsar a Members (no a otros Moderadores ni al Owner)
        if (requester.rol === 'Moderator' && target.rol === 'Moderator') {
            throw new Error('Los moderadores no pueden expulsar a otros moderadores');
        }

        // No se puede expulsar a sí mismo
        if (requesterId === targetUserId) {
            throw new Error('No puedes expulsarte a ti mismo. Usa la opción "Salir del grupo"');
        }

        // Eliminar al miembro (soft delete)
        const { error: deleteError } = await supabase
            .from('miembros_grupo')
            .update({ 
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id_grupo', groupId)
            .eq('id_perfil', targetUserId);

        if (deleteError) throw deleteError;

        // Registrar log de auditoría
        await registrarExpulsarMiembro(requesterId, groupId, targetUserId, target.rol, ipAddress);

        return { success: true, message: 'Miembro expulsado exitosamente' };
    },

    /**
     * Obtener solicitudes de unión pendientes (Owner y Moderator)
     */
    async getPendingRequests(userId, groupId) {
        // Primero verificar el tipo de grupo
        const { data: grupo, error: groupError } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .eq('estado', 'activo')
            .is('deleted_at', null)
            .single();

        if (groupError || !grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Los grupos abiertos no tienen solicitudes pendientes
        if (grupo.visibilidad === 'Open') {
            return [];
        }

        // Verificar permisos (solo Owner y Moderator pueden ver solicitudes)
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
            throw new Error('No tienes permisos para ver solicitudes');
        }

        // Obtener solicitudes pendientes
        const { data: requests, error: requestsError } = await supabase
            .from('invitaciones_solicitudes')
            .select(`
                id,
                id_usuario_origen,
                fecha_solicitud,
                profiles:id_usuario_origen (
                    id,
                    username
                )
            `)
            .eq('id_grupo', groupId)
            .eq('tipo', 'solicitud')
            .eq('estado', 'pendiente')
            .is('deleted_at', null)
            .order('fecha_solicitud', { ascending: false });

        if (requestsError) {
            console.error('Error getting pending requests:', requestsError);
            throw new Error('Error al obtener las solicitudes');
        }

        return requests || [];
    },

    /**
     * Aprobar/rechazar solicitud de unión (Owner y Moderator)
     */
    async handleJoinRequest(requesterId, groupId, requestId, approve, ipAddress = null) {
        // Verificar permiso de administrar solicitudes
        const { tienePermiso, error: permisoError } = await permissionService.tienePermiso(
            requesterId,
            groupId,
            PERMISOS.ADMINISTRAR_SOLICITUDES
        );

        if (permisoError || !tienePermiso) {
            throw new Error(permisoError || 'No tienes permisos para gestionar solicitudes');
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
            // Verificar si ya existe un registro (incluso eliminado)
            const { data: existingMember } = await supabase
                .from('miembros_grupo')
                .select('id, deleted_at')
                .eq('id_grupo', groupId)
                .eq('id_perfil', request.id_usuario_origen)
                .single();

            if (existingMember) {
                // Si existe pero está eliminado, restaurarlo
                if (existingMember.deleted_at) {
                    const { error: updateError } = await supabase
                        .from('miembros_grupo')
                        .update({
                            deleted_at: null,
                            rol: 'Member',
                            estado_membresia: 'activo',
                            fecha_union: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingMember.id);

                    if (updateError) {
                        console.error('Error updating existing member:', updateError);
                        throw new Error('Error al agregar el miembro al grupo');
                    }
                }
                // Si existe y está activo, no hacer nada (ya es miembro)
            } else {
                // Si no existe, crear nuevo registro
                const { error: insertError } = await supabase
                    .from('miembros_grupo')
                    .insert({
                        id_grupo: groupId,
                        id_perfil: request.id_usuario_origen,
                        rol: 'Member',
                        estado_membresia: 'activo',
                        fecha_union: new Date().toISOString()
                    });

                if (insertError) {
                    console.error('Error inserting new member:', insertError);
                    throw new Error('Error al agregar el miembro al grupo');
                }
            }

            // Registrar log de auditoría
            await registrarAgregarMiembro(requesterId, groupId, request.id_usuario_origen, 'Member', ipAddress);
        }

        return { success: true };
    },

    /**
     * Invitar usuario al grupo (Miembros pueden invitar en grupos Open)
     */
    async inviteUser(requesterId, groupId, targetUserId) {
        // Verificar permiso de invitar miembros
        const { tienePermiso, error: permisoError } = await permissionService.tienePermiso(
            requesterId,
            groupId,
            PERMISOS.INVITAR_MIEMBROS
        );

        if (permisoError || !tienePermiso) {
            throw new Error(permisoError || 'No tienes permisos para invitar miembros');
        }

        // Verificar visibilidad del grupo
        const { data: grupo } = await supabase
            .from('grupos')
            .select('visibilidad')
            .eq('id', groupId)
            .is('deleted_at', null)
            .single();

        // En grupos Closed, cualquier miembro puede invitar
        // En otros tipos de grupos también
        if (!grupo) {
            throw new Error('Grupo no encontrado');
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

        // Verificar si ya existe una invitación pendiente para este usuario
        const { data: existingInvitation } = await supabase
            .from('invitaciones_solicitudes')
            .select('id')
            .eq('id_grupo', groupId)
            .eq('id_usuario_destino', targetUserId)
            .eq('tipo', 'invitacion')
            .eq('estado', 'pendiente')
            .is('deleted_at', null)
            .single();

        if (existingInvitation) {
            throw new Error('Este usuario ya tiene una invitación pendiente para este grupo');
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

        // Notificar al usuario invitado vía WebSocket
        await notificationService.notifyGroupInvitation(targetUserId, groupId, requesterId);

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
                grupos!inner (
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
            .eq('grupos.estado', 'activo')
            .is('deleted_at', null)
            .is('grupos.deleted_at', null)
            .order('fecha_union', { ascending: false });

        if (error) throw error;

        // Agregar conteo de miembros a cada grupo
        const membershipsWithCounts = await Promise.all(
            (memberships || []).map(async (membership) => {
                const { count } = await supabase
                    .from('miembros_grupo')
                    .select('id', { count: 'exact' })
                    .eq('id_grupo', membership.grupos.id)
                    .eq('estado_membresia', 'activo')
                    .is('deleted_at', null);

                return {
                    ...membership,
                    grupos: {
                        ...membership.grupos,
                        member_count: count || 0
                    }
                };
            })
        );

        return membershipsWithCounts;
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
            .eq('estado', 'activo')
            .is('deleted_at', null)
            .single();

        if (groupError || !grupo) {
            throw new Error('Grupo no encontrado');
        }

        // Verificar si el usuario es miembro
        let userMembership = null;
        let hasPendingRequest = false;
        if (userId) {
            const { data: membership } = await supabase
                .from('miembros_grupo')
                .select('rol, estado_membresia')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .is('deleted_at', null)
                .single();

            userMembership = membership;

            // Verificar si tiene una solicitud pendiente
            if (!membership) {
                const { data: pendingRequest } = await supabase
                    .from('invitaciones_solicitudes')
                    .select('id')
                    .eq('id_grupo', groupId)
                    .eq('id_usuario_origen', userId)
                    .eq('tipo', 'solicitud')
                    .eq('estado', 'pendiente')
                    .is('deleted_at', null)
                    .single();

                hasPendingRequest = !!pendingRequest;
            }
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
            user_membership: userMembership,
            has_pending_request: hasPendingRequest
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

        // Si el grupo es Closed o Restricted, verificar membresía
        if (grupo.visibilidad !== 'Open') {
            if (!userId) {
                throw new Error('Debes iniciar sesión para ver los miembros');
            }
            
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
    },

    /**
     * Buscar usuarios por username para invitar
     */
    async searchUsersToInvite(searchTerm) {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return [];
        }

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, is_limited')
            .ilike('username', `%${searchTerm.trim()}%`)
            .eq('is_limited', false)
            .limit(10);

        if (error) {
            console.error('Error searching users:', error);
            throw new Error('Error al buscar usuarios');
        }

        return users || [];
    }
};
