import { useDeveloperNotifications } from '../hooks/useDeveloperNotifications';

/**
 * Componente que muestra notificaciones de revisión de juegos para desarrolladores
 */
export const GameReviewNotifications = () => {
    const { 
        gameReviewNotifications, 
        unreadCount, 
        connected, 
        markAsRead, 
        removeNotification 
    } = useDeveloperNotifications();

    if (gameReviewNotifications.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        Notificaciones de Revisión
                    </h2>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {connected ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                            Conectado
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            Desconectado
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {gameReviewNotifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`border rounded-lg p-4 transition-all ${
                            notification.read
                                ? 'bg-gray-50 border-gray-200'
                                : notification.status === 'aprobado'
                                ? 'bg-green-50 border-green-300'
                                : 'bg-red-50 border-red-300'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">
                                        {notification.status === 'aprobado' ? '🎉' : '❌'}
                                    </span>
                                    <h3 className="font-bold text-lg">
                                        {notification.title}
                                    </h3>
                                </div>
                                
                                <p className="text-gray-700 mb-2">
                                    {notification.message}
                                </p>

                                <div className="text-sm text-gray-600 mb-2">
                                    <strong>Juego:</strong> {notification.game.nombre}
                                </div>

                                {notification.comments && (
                                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                        <strong className="text-sm text-gray-700">
                                            Comentarios del revisor:
                                        </strong>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.comments}
                                        </p>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mt-3">
                                    {new Date(notification.timestamp).toLocaleString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Marcar como leída
                                    </button>
                                )}
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
