import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeveloperAuth } from './useDeveloperAuth';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_HOST = import.meta.env.PROD ? window.location.host : 'localhost:3000';
const WS_URL = `${WS_PROTOCOL}//${WS_HOST}/ws/notifications`;

export function useDeveloperNotifications() {
  const { user, desarrollador } = useDeveloperAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const userId = user?.id || desarrollador?.id;

  const connect = useCallback(() => {
    if (!userId || wsRef.current) return;

    const isDevelopment = import.meta.env.DEV;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);

        const payload = {
          type: 'auth',
          role: 'developer',
        };

        if (isDevelopment) {
          payload.userId = userId;
        }

        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'developer_app_review') {
            const notification = {
              id: data.id || `${data.app?.id}-${data.timestamp || Date.now()}`,
              status: data.status,
              app: data.app || {},
              feedback: data.feedback || null,
              timestamp: data.timestamp || new Date().toISOString(),
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        } catch (error) {
          console.error('[WS] Error procesando mensaje developer:', error);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        if (userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error en WebSocket developer:', error);
      };
    } catch (error) {
      console.error('[WS] Error conectando developer:', error);
    }
  }, [userId]);

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
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    notifications,
    unreadCount,
    connected,
    removeNotification,
    clearAll,
  };
}
