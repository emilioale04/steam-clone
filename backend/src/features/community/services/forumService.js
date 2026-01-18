import { supabaseAdmin as supabase } from '../../../shared/config/supabase.js';

export const forumService = {
    /**
     * RG-002 - Crear un nuevo hilo en el foro del grupo
     */
    async createThread(userId, groupId, threadData) {
        // Verificar que el usuario es miembro activo del grupo
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol, estado_membresia')
            .eq('id_grupo', groupId)
            .eq('id_perfil', userId)
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        if (member.estado_membresia !== 'activo') {
            throw new Error('Tu membresía no está activa en este grupo');
        }

        // Obtener el foro del grupo
        const { data: foro, error: foroError } = await supabase
            .from('foros')
            .select('id')
            .eq('id_grupo', groupId)
            .is('deleted_at', null)
            .single();

        if (foroError || !foro) {
            throw new Error('Foro no encontrado');
        }

        // Crear el hilo
        const { data: thread, error: threadError } = await supabase
            .from('hilos')
            .insert({
                id_foro: foro.id,
                id_autor: userId,
                titulo: threadData.titulo,
                contenido: threadData.contenido,
                estado: 'abierto',
                vistas: 0
            })
            .select()
            .single();

        if (threadError) throw threadError;

        return thread;
    },

    /**
     * RG-002 - Crear un comentario en un hilo
     */
    async createComment(userId, threadId, contenido, parentCommentId = null) {
        // Obtener información del hilo y su foro/grupo
        const { data: hilo, error: hiloError } = await supabase
            .from('hilos')
            .select(`
                id,
                estado,
                foros (
                    id_grupo
                )
            `)
            .eq('id', threadId)
            .is('deleted_at', null)
            .single();

        if (hiloError || !hilo) {
            throw new Error('Hilo no encontrado');
        }

        if (hilo.estado === 'cerrado') {
            throw new Error('Este hilo está cerrado y no acepta nuevos comentarios');
        }

        // Verificar que el usuario es miembro activo del grupo
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('estado_membresia')
            .eq('id_grupo', hilo.foros.id_grupo)
            .eq('id_perfil', userId)
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        if (member.estado_membresia !== 'activo') {
            throw new Error('Tu membresía no está activa en este grupo');
        }

        // Si es una respuesta, verificar que el comentario padre existe
        if (parentCommentId) {
            const { data: parentComment, error: parentError } = await supabase
                .from('comentarios')
                .select('id')
                .eq('id', parentCommentId)
                .eq('id_hilo', threadId)
                .is('deleted_at', null)
                .single();

            if (parentError || !parentComment) {
                throw new Error('Comentario padre no encontrado');
            }
        }

        // Crear el comentario
        const { data: comment, error: commentError } = await supabase
            .from('comentarios')
            .insert({
                id_hilo: threadId,
                id_autor: userId,
                contenido: contenido,
                fecha_publicacion: new Date().toISOString(),
                editado: false,
                id_comentario_padre: parentCommentId
            })
            .select()
            .single();

        if (commentError) throw commentError;

        return comment;
    },

    /**
     * RG-002 - Cerrar/abrir hilo (Owner, Moderator o autor del hilo)
     */
    async toggleThreadStatus(userId, threadId, close = true) {
        // Obtener información del hilo
        const { data: hilo, error: hiloError } = await supabase
            .from('hilos')
            .select(`
                id,
                id_autor,
                foros (
                    id_grupo
                )
            `)
            .eq('id', threadId)
            .is('deleted_at', null)
            .single();

        if (hiloError || !hilo) {
            throw new Error('Hilo no encontrado');
        }

        // Verificar permisos (Owner, Moderator o autor)
        const isAuthor = hilo.id_autor === userId;

        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', hilo.foros.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        const isModerator = member.rol === 'Owner' || member.rol === 'Moderator';

        if (!isAuthor && !isModerator) {
            throw new Error('No tienes permisos para cerrar/abrir este hilo');
        }

        // Actualizar estado
        const newStatus = close ? 'cerrado' : 'abierto';
        const { error: updateError } = await supabase
            .from('hilos')
            .update({ estado: newStatus })
            .eq('id', threadId);

        if (updateError) throw updateError;

        return { success: true, status: newStatus };
    },

    /**
     * RG-002 - Eliminar hilo (Owner, Moderator o autor del hilo)
     */
    async deleteThread(userId, threadId) {
        // Obtener información del hilo
        const { data: hilo, error: hiloError } = await supabase
            .from('hilos')
            .select(`
                id,
                id_autor,
                foros (
                    id_grupo
                )
            `)
            .eq('id', threadId)
            .is('deleted_at', null)
            .single();

        if (hiloError || !hilo) {
            throw new Error('Hilo no encontrado');
        }

        // Verificar permisos (Owner, Moderator o autor)
        const isAuthor = hilo.id_autor === userId;

        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', hilo.foros.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        const isModerator = member.rol === 'Owner' || member.rol === 'Moderator';

        if (!isAuthor && !isModerator) {
            throw new Error('No tienes permisos para eliminar este hilo');
        }

        // Soft delete
        await supabase
            .from('hilos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', threadId);

        return { success: true };
    },

    /**
     * RG-002 - Eliminar comentario (Owner y Moderator)
     */
    async deleteComment(userId, commentId) {
        // Obtener información del comentario y su grupo
        const { data: comment, error: commentError } = await supabase
            .from('comentarios')
            .select(`
                id,
                id_autor,
                hilos (
                    foros (
                        id_grupo
                    )
                )
            `)
            .eq('id', commentId)
            .is('deleted_at', null)
            .single();

        if (commentError || !comment) {
            throw new Error('Comentario no encontrado');
        }

        // Verificar permisos
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', comment.hilos.foros.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        // El autor puede eliminar su propio comentario, o Owner/Moderator
        const isAuthor = comment.id_autor === userId;
        const isModerator = member.rol === 'Owner' || member.rol === 'Moderator';

        if (!isAuthor && !isModerator) {
            throw new Error('No tienes permisos para eliminar este comentario');
        }

        // Marcar como eliminado
        await supabase
            .from('comentarios')
            .update({ 
                deleted_at: new Date().toISOString() 
            })
            .eq('id', commentId);

        return { success: true };
    },

    /**
     * Editar comentario (solo autor)
     */
    async editComment(userId, commentId, newContent) {
        // Verificar que es el autor
        const { data: comment, error: commentError } = await supabase
            .from('comentarios')
            .select('id_autor')
            .eq('id', commentId)
            .is('deleted_at', null)
            .single();

        if (commentError || !comment) {
            throw new Error('Comentario no encontrado');
        }

        if (comment.id_autor !== userId) {
            throw new Error('Solo puedes editar tus propios comentarios');
        }

        // Actualizar
        await supabase
            .from('comentarios')
            .update({ 
                contenido: newContent,
                editado: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId);

        return { success: true };
    },

    /**
     * Obtener detalles de un comentario
     */
    async getCommentDetails(commentId) {
        const { data: comment, error } = await supabase
            .from('comentarios')
            .select('id, id_autor, id_hilo, contenido, created_at, editado')
            .eq('id', commentId)
            .is('deleted_at', null)
            .single();

        if (error || !comment) {
            throw new Error('Comentario no encontrado');
        }

        return comment;
    },

    /**
     * Obtener hilos del foro de un grupo
     */
    async getGroupThreads(userId, groupId, page = 1, limit = 20) {
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

        // Obtener el foro
        const { data: foro } = await supabase
            .from('foros')
            .select('id')
            .eq('id_grupo', groupId)
            .is('deleted_at', null)
            .single();

        if (!foro) {
            return [];
        }

        // Obtener hilos
        const offset = (page - 1) * limit;
        const { data: threads, error } = await supabase
            .from('hilos')
            .select(`
                id,
                titulo,
                contenido,
                estado,
                vistas,
                created_at,
                profiles!hilos_id_autor_fkey (
                    id,
                    username
                )
            `)
            .eq('id_foro', foro.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Contar comentarios por hilo
        const threadsWithCounts = await Promise.all(
            (threads || []).map(async (thread) => {
                const { count } = await supabase
                    .from('comentarios')
                    .select('id', { count: 'exact' })
                    .eq('id_hilo', thread.id)
                    .is('deleted_at', null);

                return {
                    ...thread,
                    comment_count: count || 0
                };
            })
        );

        return threadsWithCounts;
    },

    /**
     * Obtener detalles de un hilo con comentarios
     */
    async getThreadDetails(userId, threadId) {
        // Obtener hilo
        const { data: thread, error: threadError } = await supabase
            .from('hilos')
            .select(`
                id,
                titulo,
                contenido,
                estado,
                vistas,
                created_at,
                profiles!hilos_id_autor_fkey (
                    id,
                    username
                ),
                foros (
                    id_grupo,
                    grupos (
                        id,
                        nombre,
                        visibilidad
                    )
                )
            `)
            .eq('id', threadId)
            .is('deleted_at', null)
            .single();

        if (threadError || !thread) {
            throw new Error('Hilo no encontrado');
        }

        // Verificar acceso
        if (thread.foros.grupos.visibilidad !== 'Open') {
            if (!userId) {
                throw new Error('Debes iniciar sesión para ver este contenido');
            }

            const { data: member } = await supabase
                .from('miembros_grupo')
                .select('id')
                .eq('id_grupo', thread.foros.id_grupo)
                .eq('id_perfil', userId)
                .eq('estado_membresia', 'activo')
                .is('deleted_at', null)
                .single();

            if (!member) {
                throw new Error('No tienes acceso a este grupo');
            }
        }

        // Incrementar vistas
        await supabase
            .from('hilos')
            .update({ vistas: thread.vistas + 1 })
            .eq('id', threadId);

        // Obtener comentarios
        const { data: comments, error: commentsError } = await supabase
            .from('comentarios')
            .select(`
                id,
                contenido,
                fecha_publicacion,
                editado,
                id_comentario_padre,
                profiles!comentarios_id_autor_fkey (
                    id,
                    username
                )
            `)
            .eq('id_hilo', threadId)
            .is('deleted_at', null)
            .order('fecha_publicacion', { ascending: true });

        if (commentsError) throw commentsError;

        return {
            ...thread,
            comments: comments || []
        };
    },

    /**
     * Obtener detalles básicos de un hilo por ID (para moderación)
     */
    async getThreadById(threadId) {
        const { data: thread, error } = await supabase
            .from('hilos')
            .select('id, id_autor, titulo, estado, created_at')
            .eq('id', threadId)
            .is('deleted_at', null)
            .single();

        if (error || !thread) {
            throw new Error('Hilo no encontrado');
        }

        return thread;
    },

    /**
     * Obtener todos los foros de un grupo
     */
    async getGroupForums(userId, groupId) {
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

        // Si el grupo no es público, verificar membresía
        if (grupo.visibilidad !== 'Open' && userId) {
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

        // Obtener foros con conteo de hilos
        const { data: foros, error } = await supabase
            .from('foros')
            .select(`
                id,
                titulo,
                descripcion,
                estado,
                created_at
            `)
            .eq('id_grupo', groupId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Obtener conteo de hilos para cada foro
        const forosConConteo = await Promise.all(
            (foros || []).map(async (foro) => {
                const { count } = await supabase
                    .from('hilos')
                    .select('id', { count: 'exact' })
                    .eq('id_foro', foro.id)
                    .is('deleted_at', null);

                return {
                    ...foro,
                    thread_count: count || 0
                };
            })
        );

        return forosConConteo;
    },

    /**
     * Crear un nuevo foro en un grupo (solo Owner)
     */
    async createForum(userId, groupId, forumData) {
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
            throw new Error('Solo el dueño del grupo puede crear foros');
        }

        // Crear el foro
        const { data: foro, error: foroError } = await supabase
            .from('foros')
            .insert({
                id_grupo: groupId,
                titulo: forumData.titulo,
                descripcion: forumData.descripcion || '',
                estado: 'activo'
            })
            .select()
            .single();

        if (foroError) throw foroError;

        return foro;
    },

    /**
     * Cerrar/abrir foro (solo Owner y Moderator)
     */
    async toggleForumStatus(userId, forumId, close = true) {
        // Obtener información del foro
        const { data: foro, error: foroError } = await supabase
            .from('foros')
            .select(`
                id,
                id_grupo,
                estado
            `)
            .eq('id', forumId)
            .is('deleted_at', null)
            .single();

        if (foroError || !foro) {
            throw new Error('Foro no encontrado');
        }

        // Verificar permisos (Owner o Moderator)
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', foro.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        const isModerator = member.rol === 'Owner' || member.rol === 'Moderator';

        if (!isModerator) {
            throw new Error('No tienes permisos para cerrar/abrir foros');
        }

        // Actualizar estado
        const newStatus = close ? 'cerrado' : 'activo';
        const { error: updateError } = await supabase
            .from('foros')
            .update({ 
                estado: newStatus,
                updated_at: new Date().toISOString() 
            })
            .eq('id', forumId);

        if (updateError) throw updateError;

        return { success: true, status: newStatus };
    },

    /**
     * Eliminar foro (solo Owner y Moderator)
     */
    async deleteForum(userId, forumId) {
        // Obtener información del foro
        const { data: foro, error: foroError } = await supabase
            .from('foros')
            .select(`
                id,
                id_grupo
            `)
            .eq('id', forumId)
            .is('deleted_at', null)
            .single();

        if (foroError || !foro) {
            throw new Error('Foro no encontrado');
        }

        // Verificar permisos (Owner o Moderator)
        const { data: member, error: memberError } = await supabase
            .from('miembros_grupo')
            .select('rol')
            .eq('id_grupo', foro.id_grupo)
            .eq('id_perfil', userId)
            .eq('estado_membresia', 'activo')
            .is('deleted_at', null)
            .single();

        if (memberError || !member) {
            throw new Error('No eres miembro de este grupo');
        }

        const isModerator = member.rol === 'Owner' || member.rol === 'Moderator';

        if (!isModerator) {
            throw new Error('No tienes permisos para eliminar foros');
        }

        // Soft delete del foro
        await supabase
            .from('foros')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', forumId);

        return { success: true };
    }
};
