import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, X } from 'lucide-react';
import { useDeveloperNotifications } from '../hooks/useDeveloperNotifications';

export const DeveloperNotificationBell = ({ onNavigate }) => {
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

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate('mis-aplicaciones');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={22} />
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
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                  {unreadCount}
                </span>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-300 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="mx-auto mb-2 text-gray-500" size={28} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a475e]">
                {notifications.map((notification) => {
                  const isApproved = notification.status === 'aprobado';
                  const Icon = isApproved ? CheckCircle2 : XCircle;
                  const statusText = isApproved ? 'Aprobado' : 'Rechazado';

                  return (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-[#2a475e] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Icon
                            className={
                              isApproved ? 'text-green-400' : 'text-red-400'
                            }
                            size={22}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold mb-1">
                            Revision de juego: {statusText}
                          </p>
                          <p className="text-gray-300 text-sm mb-1">
                            {notification.app?.nombre_juego ||
                              'Juego sin nombre'}
                          </p>
                          {notification.feedback && (
                            <p className="text-gray-400 text-sm mb-2">
                              {notification.feedback}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs">
                            {new Date(notification.timestamp).toLocaleString(
                              'es-ES',
                              {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                          {onNavigate && (
                            <button
                              onClick={handleNavigate}
                              className="mt-2 text-xs text-blue-300 hover:text-blue-200"
                            >
                              Ver en Mis Aplicaciones
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
