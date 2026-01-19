import { X, AlertCircle, Shield } from 'lucide-react';

export default function GroupConsentModal({ isOpen, onClose, onAccept, onReject, groupName = null }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#1b2838] border-b border-[#2a475e] p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Shield className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">
                            Consentimiento de Uso de Datos Personales
                        </h2>
                    </div>
                    <button
                        onClick={onReject}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Alert */}
                    <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="text-blue-400 flex-shrink-0" size={24} />
                        <div>
                            <p className="text-white font-semibold mb-1">
                                Consentimiento Requerido
                            </p>
                            <p className="text-gray-300 text-sm">
                                {groupName 
                                    ? `Para unirte a "${groupName}", necesitamos tu consentimiento.`
                                    : 'Para participar en grupos de la comunidad, necesitamos tu consentimiento.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-4 text-gray-300">
                        <div>
                            <h3 className="text-white font-semibold mb-2">
                                Información sobre el Tratamiento de Datos
                            </h3>
                            <p className="text-sm leading-relaxed">
                                De conformidad con el <span className="text-blue-400 font-semibold">Artículo 7 de la Ley Orgánica de Protección de Datos Personales (LOPDP)</span>, 
                                antes de unirte o crear un grupo en nuestra plataforma, solicitamos tu consentimiento libre, específico e informado para el uso de los siguientes datos personales:
                            </p>
                        </div>

                        <div className="bg-[#2a475e] rounded-lg p-4 space-y-2">
                            <h4 className="text-white font-semibold text-sm mb-2">Datos que serán compartidos:</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    <span><span className="font-semibold text-white">Nombre de usuario:</span> Será visible para otros miembros del grupo</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    <span><span className="font-semibold text-white">Avatar/Imagen de perfil:</span> Se mostrará en las listas de miembros y publicaciones</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    <span><span className="font-semibold text-white">Estado de cuenta:</span> Información básica sobre tu actividad en el grupo</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-2">Finalidad del Tratamiento</h4>
                            <p className="text-sm leading-relaxed">
                                Estos datos serán utilizados exclusivamente para:
                            </p>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">→</span>
                                    <span>Identificarte como miembro del grupo</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">→</span>
                                    <span>Facilitar la interacción con otros miembros</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">→</span>
                                    <span>Gestionar la membresía y permisos dentro del grupo</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
                            <h4 className="text-yellow-400 font-semibold mb-2">Tu Derecho de Revocación</h4>
                            <p className="text-sm leading-relaxed">
                                Puedes <span className="font-semibold">revocar este consentimiento en cualquier momento</span> desde tu perfil. 
                                Al revocar el consentimiento:
                            </p>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    <span>Serás removido automáticamente de todos los grupos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    <span>No podrás unirte a nuevos grupos hasta que otorgues nuevamente el consentimiento</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    <span>Tus datos dejarán de ser visibles en los grupos</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-2">Seguridad de tus Datos</h4>
                            <p className="text-sm leading-relaxed">
                                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tus datos personales 
                                contra el acceso no autorizado, la pérdida, alteración o divulgación.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#1b2838] border-t border-[#2a475e] p-6 flex gap-3">
                    <button
                        onClick={onReject}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        No Acepto
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        Acepto los Términos
                    </button>
                </div>
            </div>
        </div>
    );
}
