import { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateThreadModal({ isOpen, onClose, onSubmit, loading }) {
    const [formData, setFormData] = useState({
        titulo: '',
        contenido: ''
    });
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación
        const newErrors = {};
        if (!formData.titulo.trim()) {
            newErrors.titulo = 'El título es requerido';
        } else if (formData.titulo.length < 5) {
            newErrors.titulo = 'El título debe tener al menos 5 caracteres';
        } else if (formData.titulo.length > 150) {
            newErrors.titulo = 'El título no puede exceder 150 caracteres';
        }

        if (!formData.contenido.trim()) {
            newErrors.contenido = 'El contenido es requerido';
        } else if (formData.contenido.length < 10) {
            newErrors.contenido = 'El contenido debe tener al menos 10 caracteres';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onSubmit(formData);
            setFormData({ titulo: '', contenido: '' });
            setErrors({});
            onClose();
        } catch (error) {
            setErrors({ submit: error.message });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Crear Nuevo Hilo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error general */}
                    {errors.submit && (
                        <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-2">
                            Título del Hilo *
                        </label>
                        <input
                            type="text"
                            id="titulo"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 bg-[#2a475e] border ${
                                errors.titulo ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Escribe un título descriptivo..."
                            maxLength={150}
                            disabled={loading}
                        />
                        <div className="flex justify-between mt-1">
                            {errors.titulo && (
                                <span className="text-red-400 text-sm">{errors.titulo}</span>
                            )}
                            <span className="text-gray-400 text-sm ml-auto">
                                {formData.titulo.length}/150
                            </span>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div>
                        <label htmlFor="contenido" className="block text-sm font-medium text-gray-300 mb-2">
                            Contenido *
                        </label>
                        <textarea
                            id="contenido"
                            name="contenido"
                            value={formData.contenido}
                            onChange={handleChange}
                            rows={8}
                            className={`w-full px-4 py-2 bg-[#2a475e] border ${
                                errors.contenido ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                            placeholder="Escribe el contenido de tu hilo..."
                            disabled={loading}
                        />
                        {errors.contenido && (
                            <span className="text-red-400 text-sm mt-1 block">{errors.contenido}</span>
                        )}
                        <p className="text-gray-400 text-sm mt-2">
                            Comparte tus ideas, preguntas o experiencias con la comunidad
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Creando...' : 'Crear Hilo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
