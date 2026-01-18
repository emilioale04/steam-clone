/**
 * Navbar principal del Dashboard de Steamworks
 */
import { LogOut } from 'lucide-react';

export const NavbarSteamworks = ({ activeTab, onTabChange, nombreDesarrollador, rolDesarrollador, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mis-aplicaciones', label: 'Mis Aplicaciones' },
    { id: 'nueva-aplicacion', label: 'Nueva Aplicación' },
    { id: 'configuracion-tienda', label: 'Configuración de Tienda' },
    { id: 'objetos-marketplace', label: 'Objetos Marketplace' },
    { id: 'precios', label: 'Precios' },
    { id: 'gestion-claves', label: 'Gestión de Claves' },
    { id: 'mi-perfil', label: 'Mi Perfil' },
  ];

  return (
    <nav className="bg-[#1e2a38] border-b border-[#2a3f5f]">
      <div className="px-6 py-4">
        {/* Header con logo y user info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-[#66c0f4]">Steam</span>works
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              {nombreDesarrollador}
            </span>
            {rolDesarrollador && (
              <span className="px-2 py-1 bg-[#66c0f4] text-xs text-white rounded">
                {rolDesarrollador}
              </span>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600/80 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#66c0f4] text-white'
                  : 'bg-[#2a3f5f] text-gray-300 hover:bg-[#3d5a80] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
