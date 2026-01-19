import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, XCircle } from 'lucide-react';
import { useDeveloperNotifications } from '../hooks/useDeveloperNotifications';

export const DeveloperNotificationBell = () => {
  const { notifications, unreadCount, removeNotification, clearAll } =
    useDeveloperNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderStatus = (status) => {
    if (status === 'aprobado') {
      return (
        <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
          <CheckCircle size={14} />
          Aprobado
        </span>
      );
    }
    if (status === 'rechazado') {
      return (
        <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
          <XCircle size={14} />
          Rechazado
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#1b2838] rounded-lg shadow-xl border border-[#2a475e] z-50">
          <div className="flex items-center justify-between p-4 border-b border-[#2a475e]">
            <h3 className="text-white font-semibold">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
              )}
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="mx-auto mb-2 text-gray-500" size={32} />
                <p>Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a475e]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-[#2a475e] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-white text-sm font-semibold">
                            {notification.title || 'Revision de juego'}
                          </p>
                          {renderStatus(notification.status)}
                        </div>
                        <p className="text-gray-300 text-sm mb-1">
                          {notification.message ||
                            `Estado actualizado para ${notification.app?.nombre_juego || 'tu juego'}.`}
                        </p>
                        {notification.app?.app_id && (
                          <p className="text-gray-500 text-xs mb-2">
                            App ID: {notification.app.app_id}
                          </p>
                        )}
                        {notification.comentarios && (
                          <div className="bg-[#16202d] border border-[#2a475e] rounded p-2 text-xs text-gray-300 mb-2">
                            Comentarios: {notification.comentarios}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs">
                          {new Date(
                            notification.timestamp || 0,
                          ).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Cerrar notificacion"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
