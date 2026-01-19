import { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateForumModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.titulo.trim()) {
            setError('El título es obligatorio');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            setFormData({ titulo: '', descripcion: '' });
            onClose();
        } catch (err) {
            setError(err.message || 'Error al crear el foro');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ titulo: '', descripcion: '' });
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a475e]">
                    <h2 className="text-2xl font-bold text-white">Crear Nuevo Foro</h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Título del Foro <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            placeholder="Ej: Discusión General, Anuncios, Soporte..."
                            maxLength={100}
                            className="w-full bg-[#316282] text-white px-4 py-3 rounded outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {formData.titulo.length}/100 caracteres
                        </p>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Describe el propósito de este foro..."
                            maxLength={500}
                            rows={4}
                            className="w-full bg-[#316282] text-white px-4 py-3 rounded outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {formData.descripcion.length}/500 caracteres
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.titulo.trim()}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creando...
                                </>
                            ) : (
                                'Crear Foro'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
