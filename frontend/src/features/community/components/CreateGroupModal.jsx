import { useState } from 'react';
import { Globe, Lock, ShieldCheck, X } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        avatar_url: '',
        visibilidad: 'Open'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Opciones de visibilidad con iconos y descripciones
    const visibilityOptions = [
        {
            value: 'Open',
            label: 'Public',
            description: 'Anyone can view and join the group instantly without approval.',
            icon: Globe
        },
        {
            value: 'Restricted',
            label: 'Restricted',
            description: 'Anyone can view, but users must apply and be approved to join.',
            icon: ShieldCheck
        },
        {
            value: 'Closed',
            label: 'Closed',
            description: 'Group is hidden. Membership is by invitation only.',
            icon: Lock
        }
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(formData);
            setFormData({
                nombre: '',
                descripcion: '',
                avatar_url: '',
                visibilidad: 'Open'
            });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleVisibilitySelect = (value) => {
        if (!isSubmitting) {
            setFormData({
                ...formData,
                visibilidad: value
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#2a475e]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2a475e] shrink-0">
                    <h2 className="text-2xl font-bold text-white">Crear Grupo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nombre del grupo *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                required
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
                                rows="3"
                                disabled={isSubmitting}
                                maxLength={500}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                URL del avatar
                            </label>
                            <input
                                type="url"
                                name="avatar_url"
                                value={formData.avatar_url}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                disabled={isSubmitting}
                                placeholder="https://ejemplo.com/imagen.jpg"
                            />
                        </div>

                        {/* Privacy Settings - Card Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Privacy Settings
                            </label>
                            <p className="text-xs text-gray-500 mb-4">
                                Control who can see and join your group.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {visibilityOptions.map((option) => {
                                    const IconComponent = option.icon;
                                    const isSelected = formData.visibilidad === option.value;
                                    
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleVisibilitySelect(option.value)}
                                            disabled={isSubmitting}
                                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                                isSelected
                                                    ? 'bg-blue-600/20 border-blue-500'
                                                    : 'bg-[#1e2837] border-[#2a475e] hover:border-[#3a576e]'
                                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="flex flex-col items-start gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    isSelected ? 'bg-blue-500/30' : 'bg-[#2a475e]'
                                                }`}>
                                                    <IconComponent 
                                                        size={20} 
                                                        className={isSelected ? 'text-blue-400' : 'text-gray-400'} 
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`font-semibold text-sm ${
                                                        isSelected ? 'text-white' : 'text-gray-200'
                                                    }`}>
                                                        {option.label}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-[#2a475e] shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-300 bg-[#2a475e] rounded-lg hover:bg-[#366d91] transition-colors font-medium"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
