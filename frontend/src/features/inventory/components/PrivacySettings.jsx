import { useState, useEffect } from 'react';
import { Shield, Eye, Users, Lock, RefreshCw, ShoppingBag, Check, AlertCircle, Loader2 } from 'lucide-react';
import { privacyService, PRIVACY_LEVELS, PRIVACY_LABELS, PRIVACY_DESCRIPTIONS } from '../services/privacyService';

/**
 * Componente de configuración de privacidad del perfil
 * Permite al usuario configurar la visibilidad de su inventario, trades y marketplace
 */
export const PrivacySettings = () => {
    const [settings, setSettings] = useState({
        inventory: 'public',
        trade: 'public',
        marketplace: 'public'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pendingChanges, setPendingChanges] = useState({});

    // Cargar configuración actual
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await privacyService.getPrivacySettings();
            setSettings(data);
            setPendingChanges({});
        } catch (err) {
            setError('Error al cargar la configuración de privacidad');
            console.error('Error loading privacy settings:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cambiar un valor localmente (sin guardar aún)
    const handleChange = (type, value) => {
        setSettings(prev => ({
            ...prev,
            [type]: value
        }));
        setPendingChanges(prev => ({
            ...prev,
            [type]: value
        }));
        setSuccess(null);
        setError(null);
    };

    // Guardar todos los cambios pendientes
    const handleSave = async () => {
        if (Object.keys(pendingChanges).length === 0) {
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            await privacyService.updatePrivacySettings(pendingChanges);
            
            setPendingChanges({});
            setSuccess('Configuración de privacidad actualizada');
            
            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al guardar la configuración');
            console.error('Error saving privacy settings:', err);
        } finally {
            setSaving(false);
        }
    };

    // Cancelar cambios pendientes
    const handleCancel = () => {
        loadSettings();
        setSuccess(null);
        setError(null);
    };

    // Íconos para cada nivel de privacidad
    const getPrivacyIcon = (level) => {
        switch (level) {
            case PRIVACY_LEVELS.PUBLIC:
                return <Eye className="text-green-400" size={18} />;
            case PRIVACY_LEVELS.FRIENDS:
                return <Users className="text-blue-400" size={18} />;
            case PRIVACY_LEVELS.PRIVATE:
                return <Lock className="text-red-400" size={18} />;
            default:
                return <Eye className="text-gray-400" size={18} />;
        }
    };

    // Colores para cada nivel
    const getPrivacyColor = (level) => {
        switch (level) {
            case PRIVACY_LEVELS.PUBLIC:
                return 'border-green-500 bg-green-500/10';
            case PRIVACY_LEVELS.FRIENDS:
                return 'border-blue-500 bg-blue-500/10';
            case PRIVACY_LEVELS.PRIVATE:
                return 'border-red-500 bg-red-500/10';
            default:
                return 'border-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="bg-[#16202d] rounded-xl p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-blue-400 mr-2" size={24} />
                    <span className="text-gray-400">Cargando configuración...</span>
                </div>
            </div>
        );
    }

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    return (
        <div className="bg-[#16202d] rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600/20 p-2 rounded-lg">
                    <Shield className="text-purple-400" size={24} />
                </div>
                <div>
                    <h2 className="text-white text-xl font-bold">Configuración de Privacidad</h2>
                    <p className="text-gray-400 text-sm">Controla quién puede ver e interactuar con tu perfil</p>
                </div>
            </div>

            {/* Mensajes de error/éxito */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="text-red-400" size={18} />
                    <span className="text-red-400 text-sm">{error}</span>
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                    <Check className="text-green-400" size={18} />
                    <span className="text-green-400 text-sm">{success}</span>
                </div>
            )}

            {/* Secciones de privacidad */}
            <div className="space-y-6">
                {/* Inventario */}
                <PrivacySection
                    icon={<Eye size={20} />}
                    title="Visibilidad del Inventario"
                    description="Controla quién puede ver los items de tu inventario"
                    type="inventory"
                    value={settings.inventory}
                    onChange={handleChange}
                    getPrivacyIcon={getPrivacyIcon}
                    getPrivacyColor={getPrivacyColor}
                />

                {/* Intercambios */}
                <PrivacySection
                    icon={<RefreshCw size={20} />}
                    title="Ofertas de Intercambio"
                    description="Controla quién puede enviarte ofertas de intercambio"
                    type="trade"
                    value={settings.trade}
                    onChange={handleChange}
                    getPrivacyIcon={getPrivacyIcon}
                    getPrivacyColor={getPrivacyColor}
                />

                {/* Marketplace */}
                <PrivacySection
                    icon={<ShoppingBag size={20} />}
                    title="Compras del Marketplace"
                    description="Controla quién puede comprar tus artículos en el mercado"
                    type="marketplace"
                    value={settings.marketplace}
                    onChange={handleChange}
                    getPrivacyIcon={getPrivacyIcon}
                    getPrivacyColor={getPrivacyColor}
                />
            </div>

            {/* Botones de acción */}
            {hasPendingChanges && (
                <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        Tienes cambios sin guardar
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Nota informativa */}
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-gray-400 text-sm">
                    <strong className="text-blue-400">Nota:</strong> Los cambios de privacidad se aplican inmediatamente después de guardar. 
                    Si configuras la privacidad de intercambios o marketplace como "Privado", no podrás recibir ofertas ni ventas respectivamente.
                </p>
            </div>
        </div>
    );
};

/**
 * Componente de sección individual de privacidad
 */
const PrivacySection = ({ icon, title, description, type, value, onChange, getPrivacyIcon, getPrivacyColor }) => {
    return (
        <div className="bg-[#1b2838] rounded-lg p-4">
            {/* Header de la sección */}
            <div className="flex items-center gap-3 mb-4">
                <div className="text-gray-400">
                    {icon}
                </div>
                <div>
                    <h3 className="text-white font-medium">{title}</h3>
                    <p className="text-gray-500 text-sm">{description}</p>
                </div>
            </div>

            {/* Opciones de privacidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.values(PRIVACY_LEVELS).map((level) => (
                    <button
                        key={level}
                        onClick={() => onChange(type, level)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                            value === level
                                ? getPrivacyColor(level)
                                : 'border-gray-700 hover:border-gray-600 bg-[#16202d]'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {getPrivacyIcon(level)}
                            <span className={`font-medium ${value === level ? 'text-white' : 'text-gray-300'}`}>
                                {PRIVACY_LABELS[level]}
                            </span>
                            {value === level && (
                                <Check className="text-white ml-auto" size={16} />
                            )}
                        </div>
                        <p className={`text-xs ${value === level ? 'text-gray-300' : 'text-gray-500'}`}>
                            {PRIVACY_DESCRIPTIONS[type][level]}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PrivacySettings;
