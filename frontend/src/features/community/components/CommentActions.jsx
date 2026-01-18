import { useState } from 'react';
import { MoreVertical, Edit, Trash2, AlertCircle, Flag } from 'lucide-react';
import ReportModal from './ReportModal';

export default function CommentActions({ 
    comment, 
    userRole, 
    userId,
    groupId,
    onEdit, 
    onDelete 
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determinar permisos
    const isAuthor = comment.profiles?.id === userId;
    const isModerator = userRole === 'Owner' || userRole === 'Moderator';
    const canEdit = isAuthor;
    const canDelete = isAuthor || isModerator;

    // Siempre mostrar menú (al menos para reportar)
    const showActions = true;

    if (!showActions) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await onDelete();
            setShowMenu(false);
            setShowConfirm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        onEdit();
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-[#1b2838] rounded transition-colors"
                title="Acciones"
            >
                <MoreVertical size={16} className="text-gray-400" />
            </button>

            {showMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1b2838] border border-[#2a475e] rounded-lg shadow-xl z-20 overflow-hidden">
                        {error && (
                            <div className="p-3 bg-red-500/10 border-b border-red-500/20">
                                <p className="text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </p>
                            </div>
                        )}

                        {canEdit && (
                            <button
                                onClick={handleEdit}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#2a475e] transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                                disabled={loading}
                            >
                                <Edit size={16} />
                                <span>Editar</span>
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className={`w-full px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300 ${
                                    canEdit ? 'border-t border-[#2a475e]' : ''
                                }`}
                                disabled={loading}
                            >
                                <Trash2 size={16} />
                                <span>Eliminar</span>
                            </button>
                        )}

                        {!isAuthor && (
                            <button
                                onClick={() => {
                                    setShowReportModal(true);
                                    setShowMenu(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-yellow-500/10 transition-colors flex items-center gap-3 text-yellow-400 hover:text-yellow-300 ${
                                    canEdit || canDelete ? 'border-t border-[#2a475e]' : ''
                                }`}
                                disabled={loading}
                            >
                                <Flag size={16} />
                                <span>Reportar</span>
                            </button>
                        )}
                    </div>
                </>
            )}

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetId={comment.id}
                targetType="comentario"
                groupId={groupId}
            />

            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-md w-full border border-[#2a475e]">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-3">
                                ¿Eliminar comentario?
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors flex items-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Eliminando...</span>
                                        </>
                                    ) : (
                                        <span>Eliminar</span>
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
