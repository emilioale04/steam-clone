import { useState } from 'react';
import { X, Clock, Ban, CheckCircle, XCircle, AlertTriangle, User, Calendar } from 'lucide-react';

export default function CommunityReportsSection({ groupId, reports, onReportProcessed }) {
    const [selectedReport, setSelectedReport] = useState(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [banType, setBanType] = useState('temporal');
    const [duration, setDuration] = useState(1);
    const [durationType, setDurationType] = useState('minutes');
    const [rejectNotes, setRejectNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const pendingReports = reports?.filter(r => r.estado === 'pendiente') || [];
    const processedReports = reports?.filter(r => r.estado !== 'pendiente') || [];

    const handleApprove = (report) => {
        setSelectedReport(report);
        setShowBanModal(true);
    };

    const handleReject = (report) => {
        setSelectedReport(report);
        setShowRejectModal(true);
    };

    const confirmBan = async () => {
        if (!selectedReport) return;

        try {
            setProcessing(true);
            const { reportService } = await import('../services/reportService');
            
            await reportService.approveReport(groupId, selectedReport.id, {
                banType,
                duration: banType === 'temporal' ? parseInt(duration) : null,
                durationType: banType === 'temporal' ? durationType : null
            });

            alert('Reporte aprobado y usuario baneado exitosamente');
            setShowBanModal(false);
            setSelectedReport(null);
            onReportProcessed();
        } catch (err) {
            alert(err.message || 'Error al aprobar reporte');
        } finally {
            setProcessing(false);
        }
    };

    const confirmReject = async () => {
        if (!selectedReport) return;

        try {
            setProcessing(true);
            const { reportService } = await import('../services/reportService');
            
            await reportService.rejectReport(groupId, selectedReport.id, rejectNotes);

            alert('Reporte rechazado exitosamente');
            setShowRejectModal(false);
            setSelectedReport(null);
            setRejectNotes('');
            onReportProcessed();
        } catch (err) {
            alert(err.message || 'Error al rechazar reporte');
        } finally {
            setProcessing(false);
        }
    };

    const handleRevokeBan = async (report) => {
        if (!report.id_reportado) {
            alert('Error: No se pudo identificar el usuario baneado');
            return;
        }

        if (!confirm(`¿Revocar el baneo de ${report.reportado?.username}? El usuario podrá acceder al contenido del grupo nuevamente.`)) {
            return;
        }

        try {
            setProcessing(true);
            const { reportService } = await import('../services/reportService');
            
            await reportService.revokeBan(groupId, report.id_reportado);

            alert('Baneo revocado exitosamente');
            onReportProcessed();
        } catch (err) {
            alert(err.message || 'Error al revocar baneo');
        } finally {
            setProcessing(false);
        }
    };

    const getReportTypeLabel = (tipo) => {
        const types = {
            'usuario': 'Usuario',
            'hilo': 'Hilo',
            'foro': 'Foro',
            'comentario': 'Comentario',
            'publicacion': 'Publicación',
            'grupo': 'Grupo'
        };
        return types[tipo] || tipo;
    };

    const parseReportContent = (motivo) => {
        const match = motivo?.match(/(.*)\n\[Contenido: (.*)\]$/);
        if (match) {
            return {
                reason: match[1],
                content: match[2]
            };
        }
        return {
            reason: motivo,
            content: null
        };
    };

    const isBanExpired = (report) => {
        if (report.estado !== 'resuelto') return false;
        
        // Buscar fecha de expiración en notas_admin
        const match = report.notas_admin?.match(/hasta (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/);
        if (!match) return false; // Baneo permanente o sin fecha
        
        // Parsear la fecha del formato "19/01/2026, 09:08:49 UTC"
        const dateStr = match[1];
        const [datePart, timePart] = dateStr.split(', ');
        const [day, month, year] = datePart.split('/');
        const dateISO = `${year}-${month}-${day}T${timePart}Z`;
        const banEndDate = new Date(dateISO);
        const now = new Date();
        
        return now >= banEndDate;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Reportes de Comunidad</h3>
                <p className="text-gray-400 text-sm">
                    Gestiona los reportes enviados por miembros del grupo
                </p>
            </div>

            {/* Reportes Pendientes */}
            {pendingReports.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-400" size={20} />
                        Reportes Pendientes ({pendingReports.length})
                    </h4>
                    <div className="space-y-3">
                        {pendingReports.map((report) => {
                            const { reason, content } = parseReportContent(report.motivo);
                            console.log('Report:', report);
                            console.log('Parsed:', { reason, content });
                            return (
                            <div key={report.id} className="bg-[#2a475e] rounded-lg p-4 border-l-4 border-yellow-500">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="text-gray-400" size={16} />
                                            <span className="text-white font-semibold">
                                                {report.reportante?.username || 'Usuario desconocido'}
                                            </span>
                                            {report.reportado ? (
                                                <>
                                                    <span className="text-gray-400">reportó a</span>
                                                    <span className="text-red-400 font-semibold">
                                                        {report.reportado.username}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">reportó el {getReportTypeLabel(report.tipo_objetivo).toLowerCase()}</span>
                                            )}
                                        </div>

                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                                {getReportTypeLabel(report.tipo_objetivo)}
                                            </span>
                                            <span className="text-gray-500 text-xs">
                                                IDs: {report.id_reportante?.substring(0, 8)}... → {report.id_reportado?.substring(0, 8)}...
                                            </span>
                                        </div>

                                        {content && (
                                            <div className="text-gray-300 text-sm mb-2 bg-[#1b2838] rounded p-2">
                                                <span className="font-semibold text-blue-400">{getReportTypeLabel(report.tipo_objetivo)}:</span>
                                                <p className="mt-1 italic">"{content}"</p>
                                            </div>
                                        )}

                                        <p className="text-gray-300 text-sm mb-2">
                                            <span className="font-semibold">Motivo:</span> {reason}
                                        </p>

                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            <Calendar size={12} />
                                            {new Date(report.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {report.id_reportado ? (
                                            <button
                                                onClick={() => handleApprove(report)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                                            >
                                                <Ban size={16} />
                                                Banear
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg flex items-center gap-2 text-sm" title="Los foros no tienen autor específico">
                                                <Ban size={16} />
                                                No aplica baneo
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleReject(report)}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <XCircle size={16} />
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )}

            {pendingReports.length === 0 && (
                <div className="bg-[#2a475e] rounded-lg p-8 text-center">
                    <CheckCircle className="mx-auto text-green-400 mb-2" size={48} />
                    <p className="text-white font-semibold mb-1">No hay reportes pendientes</p>
                    <p className="text-gray-400 text-sm">Todos los reportes han sido procesados</p>
                </div>
            )}

            {/* Reportes Procesados */}
            {processedReports.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                        Historial de Reportes ({processedReports.length})
                    </h4>
                    <div className="space-y-2">
                        {processedReports.slice(0, 5).map((report) => (
                            <div key={report.id} className="bg-[#1b2838] rounded-lg p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-300">
                                            {report.reportante?.username}
                                        </span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-gray-300">
                                            {report.reportado?.username}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {report.estado === 'resuelto' ? (
                                            <>
                                                {isBanExpired(report) ? (
                                                    <span className="text-green-400 flex items-center gap-1">
                                                        <CheckCircle size={14} />
                                                        Resuelto
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-red-400 flex items-center gap-1">
                                                            <Ban size={14} />
                                                            Baneado
                                                        </span>
                                                        <button
                                                            onClick={() => handleRevokeBan(report)}
                                                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                                                            title="Revocar baneo"
                                                        >
                                                            Revocar
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <XCircle size={14} />
                                                Rechazado
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {report.notas_admin && (
                                    <p className="text-gray-500 text-xs mt-1">{report.notas_admin}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Baneo */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Ban className="text-red-400" size={24} />
                                Banear Usuario
                            </h3>
                            <button onClick={() => setShowBanModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-4">
                            ¿Deseas banear a <span className="text-red-400 font-semibold">{selectedReport?.objetivo?.username}</span>?
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-white font-semibold mb-2 block">Tipo de Baneo</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setBanType('temporal')}
                                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                            banType === 'temporal'
                                                ? 'bg-yellow-600 text-white'
                                                : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e]'
                                        }`}
                                    >
                                        <Clock size={16} className="inline mr-1" />
                                        Temporal
                                    </button>
                                    <button
                                        onClick={() => setBanType('permanente')}
                                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                            banType === 'permanente'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e]'
                                        }`}
                                    >
                                        <Ban size={16} className="inline mr-1" />
                                        Permanente
                                    </button>
                                </div>
                            </div>

                            {banType === 'temporal' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white text-sm mb-1 block">Duración</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white text-sm mb-1 block">Unidad</label>
                                        <select
                                            value={durationType}
                                            onChange={(e) => setDurationType(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="minutes">Minutos</option>
                                            <option value="hours">Horas</option>
                                            <option value="days">Días</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBanModal(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmBan}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-semibold"
                            >
                                {processing ? 'Baneando...' : 'Confirmar Baneo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rechazo */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Rechazar Reporte</h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-4">
                            ¿Deseas rechazar este reporte?
                        </p>

                        <div className="mb-6">
                            <label className="text-white text-sm mb-2 block">Notas (opcional)</label>
                            <textarea
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Razón del rechazo..."
                                className="w-full px-3 py-2 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                {processing ? 'Rechazando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
