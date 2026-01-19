import PropTypes from 'prop-types';
import { User } from 'lucide-react';
import { ROLES } from '../../../shared/context/AuthContext';
import { PlayButton } from '../../family';
import { ReviewSection } from '../../reviews';

export const DevTestZone = ({ user, debugSetRole, featuredGame, isDemoBusy, setIsDemoBusy }) => {
    if (!user) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#0f151c] rounded-b-xl border-t border-purple-500/30 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-purple-400 font-bold text-xl mb-2 flex items-center gap-2">
                        <User size={20} />
                        Zona de Pruebas de Desarrollo
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Usa estos controles para verificar las funciones de Desarrollo Seguro (RBAC y Préstamo Familiar).
                        <br />
                        <span className="text-xs text-yellow-500/80 mt-1 inline-block">
                            * Este panel es visible solo en entorno de desarrollo/pruebas.
                        </span>
                    </p>

                    <div className="bg-[#1b2838] p-4 rounded-lg border border-gray-700">
                        <h4 className="text-gray-300 text-sm font-bold mb-3 border-b border-gray-600 pb-2">Switcher de Roles (RBAC)</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-gray-400 text-xs mr-2">Rol Actual: <span className="text-white font-mono">{user?.role || 'Invitado'}</span></span>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(ROLES).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => debugSetRole(role)}
                                        className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${user?.role === role
                                            ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] ring-1 ring-purple-400'
                                            : 'bg-[#2a3f5a] text-gray-300 hover:bg-[#3c506e] hover:text-white'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Demo Components */}
                {featuredGame && (
                    <div className="flex-1 bg-[#16202d] p-4 rounded-lg border border-gray-700 w-full md:max-w-lg">
                        <h4 className="text-white font-bold mb-3 text-sm border-b border-gray-700 pb-2">
                            Demo de Componentes: Préstamo Familiar y Reseñas
                        </h4>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-xs font-medium">Simular "Dueño" Jugando (Solo para rol Familiar)</span>
                                <label className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer bg-[#1b2838] px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="rounded bg-[#2a3f5a] border-gray-600 text-blue-500 focus:ring-blue-500"
                                        checked={isDemoBusy}
                                        onChange={(e) => setIsDemoBusy(e.target.checked)}
                                    />
                                    <span className={isDemoBusy ? "text-red-400 font-bold" : "text-green-400"}>
                                        {isDemoBusy ? "Jugando (Ocupado)" : "Desconectado (Libre)"}
                                    </span>
                                </label>
                            </div>

                            <div className="bg-[#1b2838] p-4 rounded flex justify-center border border-gray-700 border-dashed">
                                <PlayButton game={{ ...featuredGame, ownerId: 999, is_busy: isDemoBusy }} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <span className="text-gray-400 text-xs font-medium block mb-2">Prueba de Permisos de Reseñas</span>
                            <ReviewSection gameId={featuredGame.id} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

DevTestZone.propTypes = {
    user: PropTypes.object,
    debugSetRole: PropTypes.func.isRequired,
    featuredGame: PropTypes.object,
    isDemoBusy: PropTypes.bool.isRequired,
    setIsDemoBusy: PropTypes.func.isRequired,
};
