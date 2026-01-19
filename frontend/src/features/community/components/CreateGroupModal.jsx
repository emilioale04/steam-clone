import { useState } from 'react';

export default function CreateGroupModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        avatar_url: '',
        visibilidad: 'Open'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

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

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-md w-full p-6 border border-[#2a475e]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Crear Grupo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Nombre del grupo *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            required
                            disabled={isSubmitting}
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            rows="3"
                            disabled={isSubmitting}
                            maxLength={500}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            URL del avatar
                        </label>
                        <input
                            type="url"
                            name="avatar_url"
                            value={formData.avatar_url}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            disabled={isSubmitting}
                            placeholder="https://ejemplo.com/imagen.jpg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Visibilidad *
                        </label>
                        <select
                            name="visibilidad"
                            value={formData.visibilidad}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#316282] text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            <option value="Open">Abierto - Cualquiera puede unirse</option>
                            <option value="Restricted">Restringido - Requiere aprobación</option>
                            <option value="Closed">Privado - Solo por invitación</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            {formData.visibilidad === 'Open' && 'Los usuarios pueden unirse libremente'}
                            {formData.visibilidad === 'Restricted' && 'Los usuarios deben solicitar unirse'}
                            {formData.visibilidad === 'Closed' && 'Solo miembros pueden invitar'}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 bg-[#2a475e] rounded-lg hover:bg-[#366d91] transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600"
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
