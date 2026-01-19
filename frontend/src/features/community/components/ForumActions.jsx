import { useState } from 'react';
import { MoreVertical, Lock, Unlock, Trash2, AlertCircle, Flag } from 'lucide-react';

export default function ForumActions({ 
    forum, 
    userRole,
    groupId,
    userId,
    onToggleStatus, 
    onDelete 
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showConfirm, setShowConfirm] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Owner y Moderator pueden ver acciones de moderación
    const isModerator = userRole === 'Owner' || userRole === 'Moderator';
    const canReport = !!userId; // Cualquier usuario autenticado puede reportar

    // Mostrar menú si es moderador o puede reportar
    if (!isModerator && !canReport) return null;

    const isClosed = forum.estado === 'cerrado';

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
                targetId: null, // Los foros no tienen un autor específico
                targetType: 'foro',
                reason: reportReason,
                contentId: forum.id, // ID del foro
                contentPreview: forum.titulo // Título del foro
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
        <div className="relative" onClick={(e) => e.preventDefault()}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(!showMenu);
                }}
                className="p-2 hover:bg-[#1b2838] rounded transition-colors"
                title="Acciones del foro"
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

                        {isModerator && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowConfirm('toggle');
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-[#2a475e] transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                                    disabled={loading}
                                >
                                    {isClosed ? (
                                        <>
                                            <Unlock size={18} />
                                            <span>Abrir foro</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            <span>Cerrar foro</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowConfirm('delete');
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300 border-t border-[#2a475e]"
                                    disabled={loading}
                                >
                                    <Trash2 size={18} />
                                    <span>Eliminar foro</span>
                                </button>
                            </>
                        )}

                        {canReport && !isModerator && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowReportModal(true);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-yellow-500/10 transition-colors flex items-center gap-3 text-yellow-400 hover:text-yellow-300 border-t border-[#2a475e]"
                                disabled={loading}
                            >
                                <Flag size={18} />
                                <span>Reportar foro</span>
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
                                {showConfirm === 'toggle' 
                                    ? (isClosed ? '¿Abrir foro?' : '¿Cerrar foro?')
                                    : '¿Eliminar foro?'}
                            </h3>
                            <p className="text-gray-300 mb-6">
                                {showConfirm === 'toggle' 
                                    ? (isClosed 
                                        ? 'Los miembros podrán volver a crear hilos en este foro.'
                                        : 'Los miembros no podrán crear nuevos hilos en este foro.')
                                    : 'Esta acción no se puede deshacer. El foro y todos sus hilos serán eliminados.'}
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

            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-md w-full border border-[#2a475e]">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Flag className="text-yellow-400" />
                                Reportar Foro
                            </h3>
                            <p className="text-gray-300 mb-4">
                                Estás reportando el foro: <span className="text-yellow-400 font-semibold">"{forum.titulo}"</span>
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
                                    placeholder="Describe por qué estás reportando este foro..."
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
