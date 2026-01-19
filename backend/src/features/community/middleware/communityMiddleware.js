import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

/**
 * Middleware para verificar si un usuario es miembro activo de un grupo
 */
export const requireGroupMember = (roleRequired = null) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const groupId = req.params.groupId;

            if (!groupId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de grupo no proporcionado'
                });
            }

            // Verificar membresía
            const { data: member, error } = await supabase
                .from('miembros_grupo')
                .select('rol, estado_membresia, fecha_fin_baneo')
                .eq('id_grupo', groupId)
                .eq('id_perfil', userId)
                .is('deleted_at', null)
                .single();

            if (error || !member) {
                return res.status(403).json({
                    success: false,
                    message: 'No eres miembro de este grupo'
                });
            }

            // Verificar si el baneo ha expirado y actualizar automáticamente
            if (member.estado_membresia === 'baneado' && member.fecha_fin_baneo) {
                const banEndDate = new Date(member.fecha_fin_baneo);
                const now = new Date();
                
                if (now >= banEndDate) {
                    console.log('[BAN CHECK] ✅ Baneo expirado, restaurando estado activo');
                    // El baneo ha expirado, restaurar estado activo
                    const { error: updateError } = await supabase
                        .from('miembros_grupo')
                        .update({
                            estado_membresia: 'activo',
                            fecha_fin_baneo: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id_grupo', groupId)
                        .eq('id_perfil', userId);
                    
                    if (updateError) {
                        console.error('[BAN CHECK] ❌ Error al actualizar:', updateError);
                    } else {
                        console.log('[BAN CHECK] ✅ Estado actualizado correctamente');
                    }
                    
                    member.estado_membresia = 'activo';
                } else {
                    console.log('[BAN CHECK] ⏳ Baneo aún activo');
                }
            }

            if (member.estado_membresia !== 'activo') {
                return res.status(403).json({
                    success: false,
                    message: member.estado_membresia === 'baneado' 
                        ? 'Has sido baneado de este grupo' 
                        : 'Tu membresía no está activa en este grupo'
                });
            }

            // Verificar rol si es requerido
            if (roleRequired) {
                const allowedRoles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
                if (!allowedRoles.includes(member.rol)) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos suficientes en este grupo'
                    });
                }
            }

            // Adjuntar información del miembro al request
            req.groupMember = member;
            next();
        } catch (error) {
            console.error('[COMMUNITY] Error in requireGroupMember middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar la membresía'
            });
        }
    };
};

/**
 * Middleware para verificar si un usuario es Owner o Moderator de un grupo
 */
export const requireGroupModerator = requireGroupMember(['Owner', 'Moderator']);

/**
 * Middleware para verificar si un usuario es Owner de un grupo
 */
export const requireGroupOwner = requireGroupMember('Owner');

/**
 * Middleware para verificar que el usuario es estándar (no limitado)
 */
export const requireStandardUser = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_limited')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(404).json({
                success: false,
                message: 'Perfil no encontrado'
            });
        }

        if (profile.is_limited) {
            return res.status(403).json({
                success: false,
                code: 'LIMITED_ACCOUNT',
                message: 'Los usuarios limitados no pueden acceder a esta función. Realiza una compra para activar tu cuenta.'
            });
        }

        next();
    } catch (error) {
        console.error('[COMMUNITY] Error in requireStandardUser middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar el estado de la cuenta'
        });
    }
};
