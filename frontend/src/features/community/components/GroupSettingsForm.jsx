import { useState } from 'react';
import { Upload, Save, AlertCircle, Trash2 } from 'lucide-react';

export default function GroupSettingsForm({ group, onSave, onCancel, onDelete, onLeave, isOwner, memberCount = 1 }) {
    const [formData, setFormData] = useState({
        nombre: group?.nombre || '',
        descripcion: group?.descripcion || '',
        avatar_url: group?.avatar_url || '',
        visibilidad: group?.visibilidad || 'Open'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(group?.avatar_url || null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaveLoading, setLeaveLoading] = useState(false);

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

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!onDelete) return;

        setDeleteLoading(true);
        try {
            await onDelete();
        } catch (error) {
            setErrors({ delete: error.message });
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    const handleLeaveClick = () => {
        setShowLeaveConfirm(true);
    };

    const handleLeaveConfirm = async () => {
        if (!onLeave) return;

        setLeaveLoading(true);
        try {
            await onLeave();
        } catch (error) {
            setErrors({ leave: error.message });
        } finally {
            setLeaveLoading(false);
            setShowLeaveConfirm(false);
        }
    };

    const handleLeaveCancel = () => {
        setShowLeaveConfirm(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">{/* Error general */}
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

            {/* Visibilidad - Solo para Owner */}
            {isOwner && (
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
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2a475e]">
                {/* Botones de acciones peligrosas */}
                <div className="flex items-center gap-3">
                    {/* Botón Abandonar Grupo */}
                    {onLeave && (
                        <button
                            type="button"
                            onClick={handleLeaveClick}
                            className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors font-semibold"
                        >
                            <Trash2 size={18} />
                            <span>Abandonar Grupo</span>
                        </button>
                    )}
                    {/* Botón Borrar Grupo (solo Owner) */}
                    {isOwner && onDelete && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold"
                        >
                            <Trash2 size={18} />
                            <span>Borrar Grupo</span>
                        </button>
                    )}
                </div>
                
                <div className={`flex items-center gap-3 ${!isOwner || !onDelete ? 'ml-auto' : ''}`}>
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
            </div>

            {/* Modal de Confirmación para Abandonar Grupo */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg p-6 max-w-md w-full border-2 border-orange-500">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-orange-500/10 p-3 rounded-full">
                                <AlertCircle className="text-orange-500" size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    ¿Abandonar grupo?
                                </h3>
                                {memberCount <= 1 ? (
                                    <p className="text-gray-300 text-sm mb-2">
                                        <strong className="text-orange-400">Si no hay nadie más en el grupo, el mismo será eliminado.</strong>
                                    </p>
                                ) : isOwner ? (
                                    <>
                                        <p className="text-gray-300 text-sm mb-2">
                                            <strong className="text-orange-400">Si sales del grupo, el dueño se transferirá automáticamente.</strong>
                                        </p>
                                        <p className="text-gray-300 text-sm">
                                            El sistema transferirá la propiedad del grupo al miembro con más rango disponible (Moderator). Si hay varios con el mismo rango, se elegirá al miembro con más antigüedad en el grupo.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-gray-300 text-sm">
                                        Ya no podrás acceder al contenido del grupo ni participar en las discusiones.
                                    </p>
                                )}
                            </div>
                        </div>

                        {errors.leave && (
                            <div className="bg-red-500/10 border border-red-500 rounded p-3 mb-4">
                                <p className="text-red-400 text-sm">{errors.leave}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 justify-end">
                            <button
                                type="button"
                                onClick={handleLeaveCancel}
                                disabled={leaveLoading}
                                className="px-6 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleLeaveConfirm}
                                disabled={leaveLoading}
                                className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {leaveLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Abandonando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        <span>Abandonar Grupo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b2838] rounded-lg p-6 max-w-md w-full border-2 border-red-500">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-red-500/10 p-3 rounded-full">
                                <AlertCircle className="text-red-500" size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    ¿Eliminar grupo?
                                </h3>
                                <p className="text-gray-300 text-sm mb-2">
                                    Esta acción es permanente y no se puede deshacer.
                                </p>
                                <p className="text-gray-300 text-sm">
                                    Se eliminarán todos los foros, hilos, comentarios y anuncios asociados al grupo.
                                </p>
                            </div>
                        </div>

                        {errors.delete && (
                            <div className="bg-red-500/10 border border-red-500 rounded p-3 mb-4">
                                <p className="text-red-400 text-sm">{errors.delete}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 justify-end">
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                disabled={deleteLoading}
                                className="px-6 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Eliminando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        <span>Eliminar Grupo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
