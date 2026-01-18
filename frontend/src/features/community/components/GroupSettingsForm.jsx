import { useState } from 'react';
import { Upload, Save, AlertCircle } from 'lucide-react';

export default function GroupSettingsForm({ group, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        nombre: group?.nombre || '',
        descripcion: group?.descripcion || '',
        avatar_url: group?.avatar_url || '',
        visibilidad: group?.visibilidad || 'Open'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(group?.avatar_url || null);

    const visibilityOptions = [
        {
            value: 'Open',
            label: 'Abierto',
            description: 'Cualquiera puede unirse sin necesidad de aprobación'
        },
        {
            value: 'Restricted',
            label: 'Restringido',
            description: 'Los usuarios deben solicitar unirse y esperar aprobación'
        },
        {
            value: 'Closed',
            label: 'Cerrado',
            description: 'Solo se puede unir por invitación'
        }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setFormData(prev => ({
            ...prev,
            avatar_url: url
        }));
        setPreviewImage(url);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre || formData.nombre.trim().length === 0) {
            newErrors.nombre = 'El nombre del grupo es obligatorio';
        } else if (formData.nombre.length < 3) {
            newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        } else if (formData.nombre.length > 100) {
            newErrors.nombre = 'El nombre no puede tener más de 100 caracteres';
        }

        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = 'La descripción no puede tener más de 500 caracteres';
        }

        if (formData.avatar_url && !isValidUrl(formData.avatar_url)) {
            newErrors.avatar_url = 'La URL del avatar no es válida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = () => {
        return (
            formData.nombre !== group?.nombre ||
            formData.descripcion !== (group?.descripcion || '') ||
            formData.avatar_url !== (group?.avatar_url || '') ||
            formData.visibilidad !== group?.visibilidad
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {errors.submit && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-red-500 font-semibold">Error al guardar</p>
                        <p className="text-red-400 text-sm">{errors.submit}</p>
                    </div>
                </div>
            )}

            {/* Avatar Preview */}
            <div className="bg-[#1b2838] rounded-lg p-6">
                <label className="block text-sm font-semibold text-white mb-3">
                    Avatar del Grupo
                </label>
                <div className="flex items-start gap-6">
                    <div className="shrink-0">
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="Avatar preview"
                                className="w-32 h-32 rounded object-cover border-2 border-[#2a475e]"
                                onError={() => setPreviewImage(null)}
                            />
                        ) : (
                            <div className="w-32 h-32 bg-[#2a475e] rounded flex items-center justify-center border-2 border-[#3a576e]">
                                <Upload className="text-gray-500" size={32} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="url"
                            name="avatar_url"
                            value={formData.avatar_url}
                            onChange={handleImageUrlChange}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="w-full px-4 py-2 bg-[#0d1117] border border-[#2a475e] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.avatar_url && (
                            <p className="text-red-400 text-sm mt-2">{errors.avatar_url}</p>
                        )}
                        <p className="text-gray-400 text-sm mt-2">
                            Ingresa una URL de imagen. Formatos recomendados: JPG, PNG, GIF. Tamaño recomendado: 256x256px.
                        </p>
                    </div>
                </div>
            </div>

            {/* Nombre del Grupo */}
            <div className="bg-[#1b2838] rounded-lg p-6">
                <label htmlFor="nombre" className="block text-sm font-semibold text-white mb-2">
                    Nombre del Grupo *
                </label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    maxLength={100}
                    className={`w-full px-4 py-2 bg-[#0d1117] border rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.nombre ? 'border-red-500' : 'border-[#2a475e]'
                    }`}
                    placeholder="Ingresa el nombre del grupo"
                />
                {errors.nombre && (
                    <p className="text-red-400 text-sm mt-2">{errors.nombre}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                    {formData.nombre.length}/100 caracteres
                </p>
            </div>

            {/* Descripción */}
            <div className="bg-[#1b2838] rounded-lg p-6">
                <label htmlFor="descripcion" className="block text-sm font-semibold text-white mb-2">
                    Descripción
                </label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    className={`w-full px-4 py-2 bg-[#0d1117] border rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.descripcion ? 'border-red-500' : 'border-[#2a475e]'
                    }`}
                    placeholder="Describe el propósito y tema de tu grupo"
                />
                {errors.descripcion && (
                    <p className="text-red-400 text-sm mt-2">{errors.descripcion}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                    {formData.descripcion.length}/500 caracteres
                </p>
            </div>

            {/* Visibilidad */}
            <div className="bg-[#1b2838] rounded-lg p-6">
                <label className="block text-sm font-semibold text-white mb-3">
                    Visibilidad del Grupo *
                </label>
                <div className="space-y-3">
                    {visibilityOptions.map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 rounded border-2 cursor-pointer transition-all ${
                                formData.visibilidad === option.value
                                    ? 'bg-blue-500/10 border-blue-500'
                                    : 'bg-[#0d1117] border-[#2a475e] hover:border-[#3a576e]'
                            }`}
                        >
                            <input
                                type="radio"
                                name="visibilidad"
                                value={option.value}
                                checked={formData.visibilidad === option.value}
                                onChange={handleChange}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-500 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <p className={`font-semibold ${
                                    formData.visibilidad === option.value ? 'text-blue-400' : 'text-white'
                                }`}>
                                    {option.label}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {option.description}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a475e]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors font-semibold"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading || !hasChanges()}
                    className={`flex items-center gap-2 px-6 py-2 rounded transition-colors font-semibold ${
                        loading || !hasChanges()
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Guardar Cambios</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
