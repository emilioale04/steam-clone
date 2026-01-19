import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeveloperAuth } from './useDeveloperAuth';

// Usar WSS en producción, WS en desarrollo
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_HOST = import.meta.env.PROD ? window.location.host : 'localhost:3000';
const WS_URL = `${WS_PROTOCOL}//${WS_HOST}/ws/notifications`;

// Función para obtener el token de la cookie
function getAccessToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'developer_access_token') {
            return value;
        }
    }
    return null;
}

/**
 * Hook para manejar notificaciones de desarrolladores vía WebSocket
 */
export function useDeveloperNotifications() {
    const { desarrollador } = useDeveloperAuth();
    const [notifications, setNotifications] = useState([]);
    const [gameReviewNotifications, setGameReviewNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const connectFnRef = useRef(null);

    const showReviewAlert = useCallback((data) => {
        const message = `${data.title}\n${data.message}${data.comments ? '\n\nComentarios: ' + data.comments : ''}`;
        
        if (data.status === 'aprobado') {
            console.log('✅', message);
        } else if (data.status === 'rechazado') {
            console.warn('❌', message);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!desarrollador?.id || wsRef.current) return;

        const isDevelopment = import.meta.env.DEV;
        let token = null;

        if (!isDevelopment) {
            token = getAccessToken();
            if (!token) {
                console.error('[WS Developer] No se encontró token de acceso');
                return;
            }
        }

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WS Developer] Conectado al servidor de notificaciones');
                setConnected(true);
                
                if (isDevelopment) {
                    ws.send(JSON.stringify({ type: 'auth', userId: desarrollador.id }));
                } else {
                    ws.send(JSON.stringify({ type: 'auth', token: token }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[WS Developer] Notificación recibida:', data);

                    if (data.type === 'game_review_status') {
                        const notification = {
                            id: Date.now(),
                            type: data.type,
                            status: data.status,
                            title: data.title,
                            message: data.message,
                            game: data.game,
                            comments: data.comments,
                            timestamp: data.timestamp,
                            read: false
                        };

                        setGameReviewNotifications(prev => [notification, ...prev]);
                        setNotifications(prev => [notification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(data.title, {
                                body: data.message,
                                icon: '/steamworks-icon.png',
                                tag: `game-review-${data.game.id}`
                            });
                        }

                        showReviewAlert(data);
                    }
                } catch (error) {
                    console.error('[WS Developer] Error procesando mensaje:', error);
                }
            };

            ws.onclose = () => {
                console.log('[WS Developer] Desconectado del servidor');
                setConnected(false);
                wsRef.current = null;

                if (desarrollador?.id && connectFnRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectFnRef.current();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('[WS Developer] Error en WebSocket:', error);
            };
        } catch (error) {
            console.error('[WS Developer] Error conectando:', error);
        }
    }, [desarrollador, showReviewAlert]);

    useEffect(() => {
        connectFnRef.current = connect;
    }, [connect]);

    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setGameReviewNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setGameReviewNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setGameReviewNotifications([]);
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('[WS Developer] Permiso de notificaciones:', permission);
            });
        }
    }, []);

    useEffect(() => {
        if (desarrollador?.id) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [desarrollador, connect, disconnect]);

    return {
        notifications,
        gameReviewNotifications,
        unreadCount,
        connected,
        markAsRead,
        removeNotification,
        clearAll
    };
}
