/**
 * Dashboard temporal para desarrolladores (Steamworks)
 * Vista después del login exitoso
 */

import { useNavigate } from 'react-router-dom';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const SteamworksDashboardPage = () => {
  const navigate = useNavigate();
  const { desarrollador, logout } = useDeveloperAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/steamworks/login');
    } catch (err) {
      console.error('Error en logout:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <header className="bg-[#1e2a38] border-b border-[#2a3f5f]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-[#66c0f4]">Steam</span>works
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm">
              {desarrollador?.nombre_legal}
            </span>
            <span className="px-2 py-1 bg-[#66c0f4] text-xs text-white rounded">
              {desarrollador?.rol}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/80 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            ¡Bienvenido a Steamworks!
          </h2>
          <p className="text-gray-400">
            Has iniciado sesión como desarrollador. Desde aquí podrás gestionar
            tus aplicaciones, configurar tu tienda y administrar tus ventas.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
            <h3 className="text-gray-400 text-sm mb-2">Mis Aplicaciones</h3>
            <p className="text-3xl font-bold text-[#66c0f4]">0</p>
          </div>
          <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
            <h3 className="text-gray-400 text-sm mb-2">En Revisión</h3>
            <p className="text-3xl font-bold text-yellow-400">0</p>
          </div>
          <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
            <h3 className="text-gray-400 text-sm mb-2">Publicados</h3>
            <p className="text-3xl font-bold text-green-400">0</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 bg-[#2a3f5f] rounded border border-[#3d5a80] text-left hover:border-[#66c0f4] transition-colors">
              <span className="text-[#66c0f4] font-medium block mb-1">
                + Nueva Aplicación
              </span>
              <span className="text-gray-400 text-sm">
                Registra un nuevo juego (requiere pago de $100 USD)
              </span>
            </button>
            <button className="p-4 bg-[#2a3f5f] rounded border border-[#3d5a80] text-left hover:border-[#66c0f4] transition-colors">
              <span className="text-[#66c0f4] font-medium block mb-1">
                Editar Perfil
              </span>
              <span className="text-gray-400 text-sm">
                Actualiza tu información personal y bancaria
              </span>
            </button>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-6 bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Información del Desarrollador
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Nombre:</span>
              <span className="text-white ml-2">{desarrollador?.nombre_legal}</span>
            </div>
            <div>
              <span className="text-gray-400">País:</span>
              <span className="text-white ml-2">{desarrollador?.pais}</span>
            </div>
            <div>
              <span className="text-gray-400">Rol:</span>
              <span className="text-white ml-2">{desarrollador?.rol}</span>
            </div>
            <div>
              <span className="text-gray-400">MFA:</span>
              <span className={`ml-2 ${desarrollador?.mfa_habilitado ? 'text-green-400' : 'text-yellow-400'}`}>
                {desarrollador?.mfa_habilitado ? 'Activado' : 'No activado'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
