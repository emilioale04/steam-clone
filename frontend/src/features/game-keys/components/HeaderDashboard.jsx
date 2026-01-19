
import { LogOut, Gamepad2 } from 'lucide-react';

export const HeaderDashboard = ({ nombreDesarrollador, onLogout }) => {
  return (
    <header className="bg-[#1e2a38] border-b border-[#2a3f5f] px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-[#66c0f4]" />
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Llaves</h1>
            <p className="text-sm text-gray-400">
              Steamworks Developer Panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Desarrollador</p>
            <p className="text-white font-medium">{nombreDesarrollador}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#16213e] text-white rounded transition-colors border border-[#2a3f5f]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};
