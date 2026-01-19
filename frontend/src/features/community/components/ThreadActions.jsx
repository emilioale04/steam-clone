import { useState } from 'react';
import { MoreVertical, Lock, Unlock, Trash2, AlertCircle } from 'lucide-react';

export default function ThreadActions({ 
    thread, 
    userRole, 
    userId,
    groupId,
    onToggleStatus, 
    onDelete 
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showConfirm, setShowConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determinar permisos
    const isAuthor = thread.profiles?.id === userId;
    const isModerator = userRole === 'Owner' || userRole === 'Moderator';
    const canModify = isAuthor || isModerator;

    const isClosed = thread.estado === 'cerrado';

    if (!canModify) return null;

    const handleToggleStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            await onToggleStatus(!isClosed);
            setShowMenu(false);
            setShowConfirm(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await onDelete();
            setShowMenu(false);
            setShowConfirm(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-[#1b2838] rounded transition-colors"
                title="Acciones"
            >
                <MoreVertical size={20} className="text-gray-400" />
            </button>

            {showMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-[#1b2838] border border-[#2a475e] rounded-lg shadow-xl z-20 overflow-hidden">
                        {error && (
                            <div className="p-3 bg-red-500/10 border-b border-red-500/20">
                                <p className="text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </p>
                            </div>
                        )}

                        {canModify && (
                            <>
                                <button
                                    onClick={() => setShowConfirm('toggle')}
                                    className="w-full px-4 py-3 text-left hover:bg-[#2a475e] transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                                    disabled={loading}
                                >
                                    {isClosed ? (
                                        <>
                                            <Unlock size={18} />
                                            <span>Abrir hilo</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            <span>Cerrar hilo</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setShowConfirm('delete')}
                                    className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300 border-t border-[#2a475e]"
                                    disabled={loading}
                                >
                                    <Trash2 size={18} />
                                    <span>Eliminar hilo</span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-md w-full border border-[#2a475e]">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-3">
                                {showConfirm === 'toggle' 
                                    ? (isClosed ? '¿Abrir hilo?' : '¿Cerrar hilo?')
                                    : '¿Eliminar hilo?'}
                            </h3>
                            <p className="text-gray-300 mb-6">
                                {showConfirm === 'toggle' 
                                    ? (isClosed 
                                        ? 'Los miembros podrán volver a comentar en este hilo.'
                                        : 'Los miembros no podrán agregar más comentarios a este hilo.')
                                    : 'Esta acción no se puede deshacer. El hilo y todos sus comentarios serán eliminados.'}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirm(null)}
                                    className="px-4 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={showConfirm === 'toggle' ? handleToggleStatus : handleDelete}
                                    className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                                        showConfirm === 'delete'
                                            ? 'bg-red-600 hover:bg-red-500 text-white'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    }`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <span>Confirmar</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
