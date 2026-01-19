import { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, RotateCcw, Check, X } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/community';

const PERMISSION_LABELS = {
    editar_metadatos: 'Editar metadatos (nombre, descripción, avatar)',
    expulsar_miembros: 'Expulsar miembros del grupo',
    invitar_miembros: 'Invitar nuevos miembros',
    administrar_solicitudes: 'Administrar solicitudes de unión',
    banear_usuario: 'Banear usuario'
};

const ROLE_LABELS = {
    owner: 'Dueño',
    moderator: 'Moderador',
    member: 'Miembro'
};

export default function GroupPermissionsManager({ groupId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPermissions, setOriginalPermissions] = useState([]);

    useEffect(() => {
        if (isOpen && permissions.length === 0) {
            loadPermissions();
        }
    }, [isOpen]);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/groups/${groupId}/permissions`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message);
            
            const perms = data.data;
            setPermissions(perms);
            setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
        } catch (error) {
            console.error('Error cargando permisos:', error);
            alert(error.message || 'Error al cargar permisos');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (permiso, rol) => {
        const perm = permissions.find(p => p.permiso === permiso);
        if (!perm || !perm.configurable[rol]) return; // No configurable

        const updated = permissions.map(p => {
            if (p.permiso === permiso) {
                return { ...p, [rol]: !p[rol] };
            }
            return p;
        });

        setPermissions(updated);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Preparar solo los permisos modificados
            const permisosActualizar = permissions
                .filter(p => {
                    const original = originalPermissions.find(o => o.permiso === p.permiso);
                    return original && (
                        original.moderator !== p.moderator ||
                        original.member !== p.member
                    );
                })
                .map(p => ({
                    permiso: p.permiso,
                    moderator: p.moderator,
                    member: p.member
                }));

            if (permisosActualizar.length === 0) {
                setHasChanges(false);
                return;
            }

            const response = await fetch(`${API_URL}/groups/${groupId}/permissions`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permisos: permisosActualizar })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
            setHasChanges(false);
        } catch (error) {
            console.error('Error guardando permisos:', error);
            alert(error.message || 'Error al guardar permisos');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('¿Estás seguro de resetear todos los permisos a los valores por defecto?')) {
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/groups/${groupId}/permissions/reset`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            await loadPermissions();
            setHasChanges(false);
        } catch (error) {
            console.error('Error reseteando permisos:', error);
            alert(error.message || 'Error al resetear permisos');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setHasChanges(false);
    };

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1b2838] hover:bg-[#2a475e] transition-colors rounded-lg"
            >
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Gestión de permisos</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="mt-2 bg-[#16202d] rounded-lg p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-400 mt-4">Cargando permisos...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <p className="text-gray-400 text-sm mb-4">
                                    Configura qué roles pueden realizar cada acción en el grupo.
                                </p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-500" /> = Permitido por defecto
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-yellow-500" /> = Configurable
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Permiso</th>
                                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                <th key={key} className="text-center py-3 px-4 text-gray-400 font-medium w-32">
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissions.map((perm) => (
                                            <tr key={perm.permiso} className="border-b border-gray-800 hover:bg-[#1b2838]">
                                                <td className="py-4 px-4 text-white">
                                                    {PERMISSION_LABELS[perm.permiso] || perm.permiso}
                                                </td>
                                                {['owner', 'moderator', 'member'].map((role) => {
                                                    const isConfigurable = perm.configurable?.[role];
                                                    const isEnabled = perm[role];
                                                    
                                                    return (
                                                        <td key={role} className="text-center py-4 px-4">
                                                            {isConfigurable ? (
                                                                <button
                                                                    onClick={() => handleTogglePermission(perm.permiso, role)}
                                                                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                                                                        isEnabled
                                                                            ? 'bg-green-600 hover:bg-green-700'
                                                                            : 'bg-gray-700 hover:bg-gray-600'
                                                                    }`}
                                                                >
                                                                    {isEnabled ? (
                                                                        <Check className="w-5 h-5 text-white" />
                                                                    ) : (
                                                                        <X className="w-5 h-5 text-gray-400" />
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                                                                    isEnabled
                                                                        ? 'bg-green-600/30'
                                                                        : 'bg-gray-700/30'
                                                                }`}>
                                                                    {isEnabled ? (
                                                                        <Check className="w-5 h-5 text-green-500/50" />
                                                                    ) : (
                                                                        <X className="w-5 h-5 text-gray-500/50" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                                        hasChanges && !saving
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>

                                {hasChanges && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}

                                <button
                                    onClick={handleReset}
                                    disabled={saving}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Resetear
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
