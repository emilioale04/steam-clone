import { useState, useRef, useEffect } from 'react';
import { Bell, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { groupService } from '../../features/community/services/groupService';

export default function NotificationBell() {
    const navigate = useNavigate();
    const { notifications, unreadCount, removeNotification, markAsRead, markAllAsRead } = useNotifications();
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

    const handleAcceptInvitation = async (invitation) => {
        try {
            // Aceptar invitación significa unirse al grupo directamente
            await groupService.joinGroup(invitation.id_grupo);
            alert(`Te has unido a "${invitation.grupos.nombre}" exitosamente`);
            removeNotification(invitation.id);
            setIsOpen(false);
            navigate(`/community/groups/${invitation.id_grupo}`);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert(error.message || 'Error al aceptar la invitación');
        }
    };

    const handleRejectInvitation = async (invitation) => {
        try {
            // Aquí puedes agregar un endpoint para rechazar la invitación
            // Por ahora solo la removemos de la UI
            removeNotification(invitation.id);
        } catch (error) {
            console.error('Error rejecting invitation:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#1b2838] rounded-lg shadow-xl border border-[#2a475e] z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#2a475e]">
                        <h3 className="text-white font-semibold">Notificaciones</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <>
                                    <button
                                        onClick={markAllAsRead}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                                    >
                                        Marcar todas como leídas
                                    </button>
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                        {unreadCount}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="mx-auto mb-2 text-gray-500" size={32} />
                                <p>No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2a475e]">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className="p-4 hover:bg-[#2a475e] transition-colors">
                                        {notification.tipo === 'group_announcement' ? (
                                            // Notificación de anuncio de grupo
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    {notification.grupos?.avatar_url ? (
                                                        <img
                                                            src={notification.grupos.avatar_url}
                                                            alt={notification.grupos.nombre}
                                                            className="w-12 h-12 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-[#1b2838] rounded flex items-center justify-center">
                                                            <Users className="text-gray-400" size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold mb-1">
                                                        Nuevo anuncio en {notification.grupos?.nombre}
                                                    </p>
                                                    <p className="text-gray-300 text-sm mb-1">
                                                        <span className="font-semibold text-blue-400">
                                                            {notification.author?.username}
                                                        </span>
                                                        : {notification.announcement?.titulo}
                                                    </p>
                                                    {notification.announcement?.contenido && (
                                                        <p className="text-gray-400 text-xs mb-2">
                                                            {notification.announcement.contenido}
                                                        </p>
                                                    )}
                                                    <p className="text-gray-500 text-xs mb-3">
                                                        {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/community/groups/${notification.id_grupo}`);
                                                            markAsRead(notification.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors font-semibold"
                                                    >
                                                        Ver grupo
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await markAsRead(notification.id);
                                                        removeNotification(notification.id);
                                                    }}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            // Notificación de invitación a grupo
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    {notification.grupos?.avatar_url ? (
                                                        <img
                                                            src={notification.grupos.avatar_url}
                                                            alt={notification.grupos.nombre}
                                                            className="w-12 h-12 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-[#1b2838] rounded flex items-center justify-center">
                                                            <Users className="text-gray-400" size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold mb-1">
                                                        Invitación a grupo
                                                    </p>
                                                    <p className="text-gray-300 text-sm mb-1">
                                                        <span className="font-semibold text-blue-400">
                                                            {notification.inviter?.username}
                                                        </span>
                                                        {' '}te ha invitado a unirte a{' '}
                                                        <span className="font-semibold">
                                                            {notification.grupos?.nombre}
                                                        </span>
                                                    </p>
                                                    <p className="text-gray-500 text-xs mb-3">
                                                        {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptInvitation(notification)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors font-semibold"
                                                        >
                                                            Aceptar
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectInvitation(notification)}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors font-semibold"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeNotification(notification.id)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
