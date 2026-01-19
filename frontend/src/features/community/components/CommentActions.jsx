import { useState } from 'react';
import { MoreVertical, Edit, Trash2, AlertCircle, Flag } from 'lucide-react';

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
    const [reportReason, setReportReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determinar permisos
    const isAuthor = comment.profiles?.id === userId;
    const isModerator = userRole === 'Owner' || userRole === 'Moderator';
    const canEdit = isAuthor;
    const canDelete = isAuthor || isModerator;
    const canReport = !isAuthor && !!userId; // Cualquiera excepto el autor

    // Mostrar menú si puede editar, eliminar o reportar
    if (!canEdit && !canDelete && !canReport) return null;

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

    const handleReport = async () => {
        if (!reportReason.trim()) {
            setError('Debes proporcionar un motivo para el reporte');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { reportService } = await import('../services/reportService');
            await reportService.createReport(groupId, {
                targetId: comment.profiles?.id, // ID del autor del comentario
                targetType: 'comentario',
                reason: reportReason,
                contentId: comment.id, // ID del comentario
                contentPreview: comment.contenido?.substring(0, 100) // Vista previa del contenido
            });

            alert('Reporte enviado exitosamente. Los moderadores lo revisarán.');
            setShowReportModal(false);
            setShowMenu(false);
            setReportReason('');
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

                        {canReport && (
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
                                <span>Reportar comentario</span>
                            </button>
                        )}
                    </div>
                </>
            )}

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

            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-md w-full border border-[#2a475e]">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Flag className="text-yellow-400" />
                                Reportar Comentario
                            </h3>
                            <p className="text-gray-300 mb-4">
                                Estás reportando un comentario de <span className="text-yellow-400 font-semibold">{comment.profiles?.username}</span>
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                                    <p className="text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="text-white text-sm mb-2 block font-semibold">
                                    Motivo del reporte *
                                </label>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Describe por qué estás reportando este comentario..."
                                    className="w-full px-3 py-2 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-yellow-500 resize-none"
                                    rows="4"
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowReportModal(false);
                                        setReportReason('');
                                        setError(null);
                                    }}
                                    className="px-4 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReport}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors flex items-center gap-2"
                                    disabled={loading || !reportReason.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Flag size={16} />
                                            <span>Enviar Reporte</span>
                                        </>
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
