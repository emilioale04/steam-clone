import { WebSocketServer } from 'ws';
import { supabaseAdmin as supabase } from '../config/supabase.js';

class NotificationService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map<userId, Set<WebSocket>>
        this.rateLimitMap = new Map(); // Map<ip, { count, resetTime }>
        this.MAX_CONNECTIONS_PER_IP = 20; // Máximo 20 conexiones por IP
        this.RATE_LIMIT_WINDOW = 60000; // Ventana de 1 minuto
    }

    /**
     * Verificar rate limiting por IP
     */
    checkRateLimit(ip) {
        const now = Date.now();
        const record = this.rateLimitMap.get(ip);

        if (!record || now > record.resetTime) {
            // Nueva ventana de tiempo
            this.rateLimitMap.set(ip, {
                count: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW
            });
            return true;
        }

        if (record.count >= this.MAX_CONNECTIONS_PER_IP) {
            return false; 
        }

        record.count++;
        return true;
    }

    /**
     * Inicializar el servidor WebSocket
     */
    initialize(server) {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws/notifications'
        });

        this.wss.on('connection', (ws, req) => {
            // Obtener IP del cliente
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            
            // Verificar rate limit
            if (!this.checkRateLimit(ip)) {
                console.log(`[WS] Rate limit excedido para IP: ${ip}`);
                ws.close(1008, 'Demasiadas conexiones. Intenta más tarde.');
                return;
            }

            console.log('[WS] Nueva conexión WebSocket desde:', ip);
            ws.isAuthenticated = false;

            // Timeout para autenticación (5 segundos)
            const authTimeout = setTimeout(() => {
                if (!ws.isAuthenticated) {
                    console.log('[WS] Timeout de autenticación');
                    ws.close(1008, 'Autenticación requerida');
                }
            }, 5000);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    
                    if (data.type === 'auth') {
                        clearTimeout(authTimeout);
                        await this.handleAuth(ws, data.token, data.userId);
                    }
                } catch (error) {
                    console.error('[WS] Error procesando mensaje:', error);
                    ws.close(1008, 'Error en el mensaje');
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });

            ws.on('error', (error) => {
                console.error('[WS] Error en WebSocket:', error);
            });
        });

        console.log('[WS] Servidor WebSocket inicializado en /ws/notifications');
    }

    /**
     * Autenticar y registrar cliente con validación JWT
     */
    async handleAuth(ws, token, userId) {
        const isDevelopment = process.env.NODE_ENV !== 'production';

        // En desarrollo, permitir autenticación con userId (sin token)
        if (isDevelopment && !token && userId) {
            console.log(`[WS] Modo desarrollo: autenticación con userId ${userId}`);
            
            // Verificar que el usuario existe
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, is_limited')
                .eq('id', userId)
                .single();

            if (!profile) {
                ws.close(1008, 'Usuario no encontrado');
                return;
            }

            if (profile.is_limited) {
                ws.close(1008, 'Cuenta limitada no puede recibir notificaciones');
                return;
            }

            // Registrar el cliente
            if (!this.clients.has(userId)) {
                this.clients.set(userId, new Set());
            }
            this.clients.get(userId).add(ws);
            
            ws.userId = userId;
            ws.isAuthenticated = true;
            
            console.log(`[WS] Cliente autenticado (dev): ${userId}`);
            await this.sendPendingNotifications(userId);
            return;
        }

        // En producción, SIEMPRE requerir token JWT
        if (!token) {
            ws.close(1008, 'Token JWT requerido');
            return;
        }

        try {
            // Validar el token JWT con Supabase
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                console.error('[WS] Token inválido:', error?.message);
                ws.close(1008, 'Token de autenticación inválido');
                return;
            }

            // Verificar que el usuario no esté limitado
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_limited')
                .eq('id', user.id)
                .single();

            if (profile?.is_limited) {
                console.log(`[WS] Usuario limitado intentó conectarse: ${user.id}`);
                ws.close(1008, 'Cuenta limitada no puede recibir notificaciones');
                return;
            }

            // Registrar el cliente autenticado
            if (!this.clients.has(user.id)) {
                this.clients.set(user.id, new Set());
            }
            this.clients.get(user.id).add(ws);
            
            ws.userId = user.id;
            ws.isAuthenticated = true;
            
            console.log(`[WS] Cliente autenticado exitosamente: ${user.id}`);

            // Enviar notificaciones pendientes al conectarse
            await this.sendPendingNotifications(user.id);
        } catch (error) {
            console.error('[WS] Error en autenticación:', error);
            ws.close(1008, 'Error de autenticación');
        }
    }

    /**
     * Manejar desconexión
     */
    handleDisconnect(ws) {
        if (ws.userId) {
            const userSockets = this.clients.get(ws.userId);
            if (userSockets) {
                userSockets.delete(ws);
                if (userSockets.size === 0) {
                    this.clients.delete(ws.userId);
                }
            }
            console.log(`[WS] Cliente desconectado: ${ws.userId}`);
        }
    }

    /**
     * Enviar notificación a un usuario específico
     */
    async sendNotification(userId, notification) {
        const userSockets = this.clients.get(userId);
        
        if (userSockets && userSockets.size > 0) {
            const message = JSON.stringify(notification);
            userSockets.forEach(ws => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(message);
                }
            });
            console.log(`[WS] Notificación enviada a ${userId}:`, notification.type);
        }
    }

    /**
     * Enviar notificaciones pendientes al usuario
     */
    async sendPendingNotifications(userId) {
        try {
            // Obtener invitaciones pendientes
            const { data: invitations } = await supabase
                .from('invitaciones_solicitudes')
                .select(`
                    id,
                    id_grupo,
                    tipo,
                    created_at,
                    grupos:id_grupo (
                        id,
                        nombre,
                        avatar_url
                    ),
                    inviter:id_usuario_origen (
                        id,
                        username
                    )
                `)
                .eq('id_usuario_destino', userId)
                .eq('estado', 'pendiente')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (invitations && invitations.length > 0) {
                await this.sendNotification(userId, {
                    type: 'pending_invitations',
                    count: invitations.length,
                    invitations: invitations
                });
            }
        } catch (error) {
            console.error('[WS] Error enviando notificaciones pendientes:', error);
        }
    }

    /**
     * Notificar sobre nueva invitación a grupo
     */
    async notifyGroupInvitation(targetUserId, groupId, inviterId) {
        try {
            const { data: group } = await supabase
                .from('grupos')
                .select('id, nombre, avatar_url')
                .eq('id', groupId)
                .single();

            const { data: inviter } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('id', inviterId)
                .single();

            if (group && inviter) {
                await this.sendNotification(targetUserId, {
                    type: 'group_invitation',
                    group: group,
                    inviter: inviter,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('[WS] Error notificando invitación:', error);
        }
    }

    /**
     * Notificar sobre solicitud aprobada
     */
    async notifyRequestApproved(userId, groupId) {
        try {
            const { data: group } = await supabase
                .from('grupos')
                .select('id, nombre, avatar_url')
                .eq('id', groupId)
                .single();

            if (group) {
                await this.sendNotification(userId, {
                    type: 'request_approved',
                    group: group,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('[WS] Error notificando aprobación:', error);
        }
    }

    /**
     * Notificar a desarrollador sobre estado de revisión de juego
     */
    async notifyGameReviewStatus(developerId, gameId, gameName, status, comments) {
        try {
            // Validar parámetros
            if (!developerId || !gameId || !status) {
                console.error('[WS] Parámetros inválidos para notificación de revisión de juego');
                return;
            }

            // Determinar el mensaje según el estado
            const statusMessages = {
                'aprobado': {
                    title: '🎉 ¡Juego Aprobado!',
                    message: `Tu juego "${gameName}" ha sido aprobado y está listo para publicarse.`
                },
                'rechazado': {
                    title: '❌ Juego Rechazado',
                    message: `Tu juego "${gameName}" ha sido rechazado. Por favor revisa los comentarios y realiza los cambios necesarios.`
                }
            };

            const notification = {
                type: 'game_review_status',
                status: status,
                game: {
                    id: gameId,
                    nombre: gameName
                },
                title: statusMessages[status]?.title || 'Actualización de Revisión',
                message: statusMessages[status]?.message || 'Se ha actualizado el estado de tu juego',
                comments: comments || null,
                timestamp: new Date().toISOString()
            };

            // Enviar notificación en tiempo real
            await this.sendNotification(developerId, notification);

            // Guardar en la base de datos para persistencia
            await supabase
                .from('notificaciones')
                .insert({
                    id_usuario: developerId,
                    tipo: 'game_review_status',
                    titulo: notification.title,
                    mensaje: notification.message,
                    datos_adicionales: {
                        game_id: gameId,
                        game_name: gameName,
                        status: status,
                        comments: comments
                    },
                    leido: false
                });

            console.log(`[WS] Notificación de revisión enviada al desarrollador ${developerId} para juego ${gameId} (${status})`);
        } catch (error) {
            console.error('[WS] Error notificando estado de revisión:', error);
        }
    }
}

export const notificationService = new NotificationService();
