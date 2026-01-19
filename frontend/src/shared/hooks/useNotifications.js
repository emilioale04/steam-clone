import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { notificationService } from '../services/notificationService';

// Usar WSS en producción, WS en desarrollo
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_HOST = import.meta.env.PROD ? window.location.host : 'localhost:3000';
const WS_URL = `${WS_PROTOCOL}//${WS_HOST}/ws/notifications`;

// Función para obtener el token de la cookie
function getAccessToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
            return value;
        }
    }
    return null;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!user?.id || wsRef.current) return;

        const isDevelopment = import.meta.env.DEV;
        let token = null;

        // En producción, intentar obtener token
        if (!isDevelopment) {
            token = getAccessToken();
            if (!token) {
                console.error('[WS] No se encontró token de acceso (requerido en producción)');
                return;
            }
        }

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WS] Conectado al servidor de notificaciones');
                setConnected(true);
                
                // En desarrollo: enviar userId
                // En producción: enviar token JWT
                if (isDevelopment) {
                    ws.send(JSON.stringify({
                        type: 'auth',
                        userId: user.id
                    }));
                    console.log('[WS] Autenticando en modo desarrollo con userId');
                } else {
                    ws.send(JSON.stringify({
                        type: 'auth',
                        token: token
                    }));
                    console.log('[WS] Autenticando en modo producción con JWT');
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[WS] Notificación recibida:', data);

                    if (data.type === 'pending_invitations') {
                        setNotifications(data.invitations || []);
                        setUnreadCount(data.count || 0);
                    } else if (data.type === 'group_invitation') {
                        // Nueva invitación
                        setNotifications(prev => {
                            const updated = [{
                                id: Date.now(),
                                id_grupo: data.group.id,
                                tipo: 'invitacion',
                                created_at: data.timestamp,
                                grupos: data.group,
                                inviter: data.inviter,
                                leido: false
                            }, ...prev];
                            
                            // Recalcular unreadCount
                            setUnreadCount(updated.filter(n => !n.leido).length);
                            
                            return updated;
                        });
                    } else if (data.type === 'group_announcement') {
                        // Nuevo anuncio en grupo - usar el ID de la BD si existe
                        const notificationId = data.notificationId || Date.now();
                        setNotifications(prev => {
                            // Evitar duplicados
                            if (prev.some(n => n.id === notificationId)) {
                                return prev;
                            }
                            const updated = [{
                                id: notificationId,
                                id_grupo: data.group.id,
                                tipo: 'group_announcement',
                                created_at: data.timestamp,
                                grupos: data.group,
                                author: data.author,
                                announcement: data.announcement,
                                leido: false
                            }, ...prev];
                            
                            // Recalcular unreadCount
                            setUnreadCount(updated.filter(n => !n.leido).length);
                            
                            return updated;
                        });
                    } else if (data.type === 'request_approved') {
                        // Solicitud aprobada
                        alert(`¡Tu solicitud para unirte a "${data.group.nombre}" ha sido aprobada!`);
                    }
                } catch (error) {
                    console.error('[WS] Error procesando mensaje:', error);
                }
            };

            ws.onclose = () => {
                console.log('[WS] Desconectado del servidor');
                setConnected(false);
                wsRef.current = null;

                // Reconectar después de 3 segundos
                if (user?.id) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('[WS] Error en WebSocket:', error);
            };
        } catch (error) {
            console.error('[WS] Error conectando:', error);
        }
    }, [user]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Cargar notificaciones desde BD
    const loadNotifications = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const response = await notificationService.getNotifications();
            const dbNotifications = response.data || [];
            
            // Transformar notificaciones de BD al formato esperado
            const formattedNotifications = dbNotifications.map(notif => {
                if (notif.tipo === 'group_announcement') {
                    return {
                        id: notif.id,
                        id_grupo: notif.datos_adicionales?.groupId,
                        tipo: 'group_announcement',
                        created_at: notif.created_at,
                        grupos: {
                            id: notif.datos_adicionales?.groupId,
                            nombre: notif.datos_adicionales?.groupName,
                            avatar_url: notif.datos_adicionales?.groupAvatar
                        },
                        author: {
                            id: notif.datos_adicionales?.authorId,
                            username: notif.datos_adicionales?.authorUsername
                        },
                        announcement: {
                            id: notif.datos_adicionales?.announcementId,
                            titulo: notif.datos_adicionales?.announcementTitulo,
                            contenido: notif.datos_adicionales?.announcementContenido?.substring(0, 100)
                        },
                        leido: notif.leido
                    };
                }
                return notif;
            });

            // Mezclar con notificaciones existentes, evitando duplicados
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const newNotifications = formattedNotifications.filter(n => !existingIds.has(n.id));
                const merged = [...prev, ...newNotifications];
                
                // Calcular unreadCount basado en el estado final
                const unread = merged.filter(n => !n.leido).length;
                setUnreadCount(unread);
                
                return merged;
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error loading from DB:', error);
        }
    }, [user]);

    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAsRead = useCallback(async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marking as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marking all as read:', error);
        }
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        if (user?.id) {
            loadNotifications(); // Cargar notificaciones de BD
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    return {
        notifications,
        unreadCount,
        connected,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    };
}
