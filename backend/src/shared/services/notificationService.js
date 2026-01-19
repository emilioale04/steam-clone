import { WebSocketServer } from 'ws';
import { supabaseAdmin as supabase } from '../config/supabase.js';
import { sanitizeString, limitLength } from '../utils/sanitization.js';

class NotificationService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map<userId, Set<WebSocket>>
        this.rateLimitMap = new Map(); // Map<ip, { count, resetTime }>
        this.MAX_CONNECTIONS_PER_IP = 20; // Máximo 20 conexiones por IP
        this.RATE_LIMIT_WINDOW = 60000; // Ventana de 1 minuto
        this.COOKIE_TOKEN_NAMES = ['access_token', 'session_token'];
    }

    parseCookies(cookieHeader) {
        if (!cookieHeader) return {};
        return cookieHeader.split(';').reduce((acc, cookie) => {
            const [rawKey, ...rest] = cookie.trim().split('=');
            if (!rawKey) return acc;
            acc[rawKey] = decodeURIComponent(rest.join('=') || '');
            return acc;
        }, {});
    }

    getTokenFromCookies(cookieHeader) {
        const cookies = this.parseCookies(cookieHeader);
        for (const name of this.COOKIE_TOKEN_NAMES) {
            if (cookies[name]) {
                return { token: cookies[name], name };
            }
        }
        return { token: null, name: null };
    }

    async resolveUserContext(userId, roleHint = null) {
        const lookups = roleHint === 'developer'
            ? ['developer', 'profile']
            : ['profile', 'developer'];

        for (const type of lookups) {
            if (type === 'profile') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, is_limited')
                    .eq('id', userId)
                    .maybeSingle();

                if (profile) {
                    return { userType: 'profile', profile };
                }
            }

            if (type === 'developer') {
                const { data: developer } = await supabase
                    .from('desarrolladores')
                    .select('id, cuenta_activa, rol')
                    .eq('id', userId)
                    .maybeSingle();

                if (developer) {
                    return { userType: 'developer', developer };
                }
            }
        }

        return null;
    }

    registerClient(userId, ws, userType) {
        if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
        }
        this.clients.get(userId).add(ws);

        ws.userId = userId;
        ws.userType = userType;
        ws.isAuthenticated = true;
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
            const { token: cookieToken, name: cookieName } = this.getTokenFromCookies(req.headers.cookie);
            ws.cookieToken = cookieToken;
            ws.cookieTokenName = cookieName;
            
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
                        await this.handleAuth(ws, data.token, data.userId, data.role);
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
    async handleAuth(ws, token, userId, roleHint = null) {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const authToken = token || ws.cookieToken;

        // En desarrollo, permitir autenticacion con userId (sin token)
        if (isDevelopment && !authToken && userId) {
            console.log(`[WS] Modo desarrollo: autenticacion con userId ${userId}`);

            const userContext = await this.resolveUserContext(userId, roleHint);
            if (!userContext) {
                ws.close(1008, 'Usuario no encontrado');
                return;
            }

            if (userContext.userType === 'profile' && userContext.profile?.is_limited) {
                ws.close(1008, 'Cuenta limitada no puede recibir notificaciones');
                return;
            }

            if (userContext.userType === 'developer' && !userContext.developer?.cuenta_activa) {
                ws.close(1008, 'Cuenta de desarrollador inactiva');
                return;
            }

            this.registerClient(userId, ws, userContext.userType);

            console.log(`[WS] Cliente autenticado (dev): ${userId}`);
            if (userContext.userType === 'profile') {
                await this.sendPendingNotifications(userId);
            }
            return;
        }

        // En produccion, SIEMPRE requerir token JWT
        if (!authToken) {
            ws.close(1008, 'Token JWT requerido');
            return;
        }

        try {
            // Validar el token JWT con Supabase
            const { data: { user }, error } = await supabase.auth.getUser(authToken);

            if (error || !user) {
                console.error('[WS] Token invalido:', error?.message);
                ws.close(1008, 'Token de autenticacion invalido');
                return;
            }

            const userContext = await this.resolveUserContext(user.id, roleHint);
            if (!userContext) {
                ws.close(1008, 'Usuario no encontrado');
                return;
            }

            if (userContext.userType === 'profile' && userContext.profile?.is_limited) {
                console.log(`[WS] Usuario limitado intento conectarse: ${user.id}`);
                ws.close(1008, 'Cuenta limitada no puede recibir notificaciones');
                return;
            }

            if (userContext.userType === 'developer' && !userContext.developer?.cuenta_activa) {
                console.log(`[WS] Desarrollador inactivo intento conectarse: ${user.id}`);
                ws.close(1008, 'Cuenta de desarrollador inactiva');
                return;
            }

            this.registerClient(user.id, ws, userContext.userType);

            console.log(`[WS] Cliente autenticado exitosamente: ${user.id}`);

            if (userContext.userType === 'profile') {
                await this.sendPendingNotifications(user.id);
            }
        } catch (error) {
            console.error('[WS] Error en autenticacion:', error);
            ws.close(1008, 'Error de autenticacion');
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
     * Notificar aprobacion o rechazo de un juego a un desarrollador
     */
    async notifyDeveloperAppReview(appId, status, feedback) {
        try {
            const { data: app } = await supabase
                .from('aplicaciones_desarrolladores')
                .select('id, app_id, nombre_juego, desarrollador_id')
                .eq('id', appId)
                .single();

            if (!app) {
                return;
            }

            const safeFeedback = feedback
                ? limitLength(sanitizeString(feedback), 500)
                : null;

            await this.sendNotification(app.desarrollador_id, {
                type: 'developer_app_review',
                status,
                app: {
                    id: app.id,
                    app_id: app.app_id,
                    nombre_juego: app.nombre_juego
                },
                feedback: safeFeedback,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[WS] Error notificando revision de juego:', error);
        }
    }
}

export const notificationService = new NotificationService();
