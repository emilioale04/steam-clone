import { useState } from 'react';
import { X, Ban } from 'lucide-react';

export default function BanUserModal({ isOpen, onClose, onConfirm, reportData }) {
    const [isPermanent, setIsPermanent] = useState(true);
    const [banDays, setBanDays] = useState(7);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({
            isPermanent,
            days: isPermanent ? null : banDays
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Ban className="text-red-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Banear Usuario</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-[#2a475e] rounded-lg p-4">
                        <p className="text-gray-300 mb-2">
                            <span className="font-semibold">Reportado por:</span> {reportData?.reporterName || 'Usuario'}
                        </p>
                        <p className="text-gray-300 mb-2">
                            <span className="font-semibold">Motivo:</span> {reportData?.motivo}
                        </p>
                        <p className="text-gray-400 text-sm">
                            <span className="font-semibold">Tipo:</span> {reportData?.tipo_objetivo}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer bg-[#2a475e] rounded-lg p-3 hover:bg-[#3a576e] transition-colors">
                            <input
                                type="checkbox"
                                checked={isPermanent}
                                onChange={(e) => setIsPermanent(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <div>
                                <p className="text-white font-semibold">Baneo Permanente</p>
                                <p className="text-gray-400 text-sm">
                                    El usuario será expulsado del grupo permanentemente
                                </p>
                            </div>
                        </label>

                        {!isPermanent && (
                            <div className="bg-[#2a475e] rounded-lg p-4">
                                <label className="block text-white font-semibold mb-2">
                                    Duración del baneo (días)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={banDays}
                                    onChange={(e) => setBanDays(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 bg-[#1b2838] text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                                    required={!isPermanent}
                                />
                                <p className="text-gray-400 text-sm mt-2">
                                    El usuario será desbaneado automáticamente después de {banDays} días
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold"
                        >
                            Confirmar Baneo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
