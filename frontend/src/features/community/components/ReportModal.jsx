import { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { reportService } from '../services/reportService';

export default function ReportModal({ 
    isOpen, 
    onClose, 
    targetId, 
    targetType, 
    groupId = null,
    targetTitle = null 
}) {
    const [reason, setReason] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const reportReasons = {
        perfil: [
            { value: 'spam', label: 'Spam o contenido promocional no deseado' },
            { value: 'harassment', label: 'Acoso o comportamiento abusivo' },
            { value: 'impersonation', label: 'Suplantación de identidad' },
            { value: 'inappropriate', label: 'Contenido inapropiado o ofensivo' },
            { value: 'other', label: 'Otro' }
        ],
        hilo: [
            { value: 'spam', label: 'Spam o publicidad no deseada' },
            { value: 'offtopic', label: 'Fuera de tema' },
            { value: 'inappropriate', label: 'Contenido inapropiado u ofensivo' },
            { value: 'misleading', label: 'Información falsa o engañosa' },
            { value: 'duplicate', label: 'Contenido duplicado' },
            { value: 'other', label: 'Otro' }
        ],
        comentario: [
            { value: 'spam', label: 'Spam o publicidad' },
            { value: 'harassment', label: 'Acoso o insultos' },
            { value: 'inappropriate', label: 'Contenido inapropiado' },
            { value: 'offtopic', label: 'Fuera de tema' },
            { value: 'hate', label: 'Discurso de odio' },
            { value: 'other', label: 'Otro' }
        ],
        grupo: [
            { value: 'inappropriate', label: 'Nombre o contenido inapropiado' },
            { value: 'spam', label: 'Grupo de spam' },
            { value: 'illegal', label: 'Actividad ilegal' },
            { value: 'other', label: 'Otro' }
        ]
    };

    const getTargetTypeName = () => {
        const names = {
            perfil: 'perfil',
            hilo: 'hilo',
            comentario: 'comentario',
            grupo: 'grupo'
        };
        return names[targetType] || 'contenido';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedReason) {
            setError('Por favor selecciona un motivo');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const reportData = {
                id_objetivo: targetId,
                tipo_objetivo: targetType,
                motivo: selectedReason === 'other' 
                    ? (reason || selectedReason)
                    : `${selectedReason}${reason ? ': ' + reason : ''}`,
                id_grupo: groupId
            };

            await reportService.createReport(reportData);
            setSuccess(true);
            
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason('');
                setSelectedReason('');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-md w-full border border-[#2a475e] p-8 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flag className="text-green-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Reporte Enviado
                    </h3>
                    <p className="text-gray-300">
                        Gracias por ayudar a mantener la comunidad segura. Los moderadores revisarán tu reporte.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-2xl w-full border border-[#2a475e] max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a475e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                            <Flag className="text-red-500" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Reportar {getTargetTypeName()}
                            </h2>
                            {targetTitle && (
                                <p className="text-sm text-gray-400 mt-1">{targetTitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#2a475e] rounded-lg transition-colors"
                    >
                        <X className="text-gray-400" size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-red-500 font-semibold">Error</p>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            ¿Por qué estás reportando este {getTargetTypeName()}? *
                        </label>
                        <div className="space-y-2">
                            {reportReasons[targetType]?.map((reasonOption) => (
                                <label
                                    key={reasonOption.value}
                                    className={`flex items-start gap-3 p-4 rounded border-2 cursor-pointer transition-all ${
                                        selectedReason === reasonOption.value
                                            ? 'bg-red-500/10 border-red-500'
                                            : 'bg-[#0d1117] border-[#2a475e] hover:border-[#3a576e]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reasonOption.value}
                                        checked={selectedReason === reasonOption.value}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="mt-1 w-4 h-4 text-red-600 border-gray-500 focus:ring-red-500"
                                    />
                                    <div className="flex-1">
                                        <p className={`font-medium ${
                                            selectedReason === reasonOption.value 
                                                ? 'text-red-400' 
                                                : 'text-white'
                                        }`}>
                                            {reasonOption.label}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="details" className="block text-sm font-semibold text-white mb-2">
                            Detalles adicionales (opcional)
                        </label>
                        <textarea
                            id="details"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-2 bg-[#0d1117] border border-[#2a475e] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            placeholder="Proporciona más información sobre el problema..."
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            {reason.length}/500 caracteres
                        </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                            <strong>Nota:</strong> Los reportes falsos o abusivos pueden resultar en acciones contra tu cuenta. 
                            Solo reporta contenido que genuinamente viole las reglas de la comunidad.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-[#2a475e]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors font-semibold"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedReason}
                            className={`flex items-center gap-2 px-6 py-2 rounded transition-colors font-semibold ${
                                loading || !selectedReason
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <Flag size={18} />
                                    <span>Enviar Reporte</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
