import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';

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
                        setNotifications(prev => [{
                            id: Date.now(),
                            id_grupo: data.group.id,
                            tipo: 'invitacion',
                            created_at: data.timestamp,
                            grupos: data.group,
                            inviter: data.inviter
                        }, ...prev]);
                        setUnreadCount(prev => prev + 1);
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

    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        if (user?.id) {
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
        clearAll
    };
}
