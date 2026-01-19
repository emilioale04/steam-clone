import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeveloperAuth } from './useDeveloperAuth';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_HOST = import.meta.env.PROD ? window.location.host : 'localhost:3000';
const WS_URL = `${WS_PROTOCOL}//${WS_HOST}/ws/notifications`;

function getCookieValue(name) {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, value] = cookie.trim().split('=');
    if (cookieName === name) {
      return value;
    }
  }
  return null;
}

export function useDeveloperNotifications() {
  const { user, desarrollador } = useDeveloperAuth();
  const userId = user?.id || desarrollador?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectRef = useRef(null);

  const connect = useCallback(() => {
    if (!userId || wsRef.current) return;

    const isDevelopment = import.meta.env.DEV;
    const token = getCookieValue('session_token');

    if (!token && !isDevelopment) {
      console.error('[WS] Missing session token for developer notifications');
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        } else {
          ws.send(JSON.stringify({ type: 'auth', userId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'game_review_status') return;

          const notificationId = data.review_id
            ? `${data.review_id}-${data.status}`
            : `${Date.now()}-${data.status || 'status'}`;

          setNotifications((prev) => [
            {
              id: notificationId,
              ...data,
            },
            ...prev,
          ]);
          setUnreadCount((prev) => prev + 1);
        } catch (error) {
          console.error('[WS] Error processing notification message:', error);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        if (userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connectRef.current) {
              connectRef.current();
            }
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[WS] Error connecting to WebSocket:', error);
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
    connectRef.current = connect;
  }, [connect]);

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
