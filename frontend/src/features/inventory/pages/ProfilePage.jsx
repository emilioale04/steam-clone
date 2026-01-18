import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Settings, Shield, ChevronRight, Gamepad2, Calendar, Mail, Lock, TrendingUp, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useInventory } from '../hooks/useInventory';
import { WalletCard } from '../../wallet';
import { PrivacySettings } from '../components/PrivacySettings';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { inventory, loading: inventoryLoading } = useInventory(user?.id);
  const [activeTab, setActiveTab] = useState('overview');

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Fecha no disponible';

  // Calculate stats
  const tradeableCount = inventory?.filter(item => item.is_tradeable && !item.is_locked).length || 0;
  const marketableCount = inventory?.filter(item => item.is_marketable && !item.is_locked).length || 0;
  const lockedCount = inventory?.filter(item => item.is_locked).length || 0;

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="text-white" size={24} />
              </div>
              <span className="text-white text-xl font-bold">Steam Clone</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Tienda
              </Link>
              <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                Comunidad
              </Link>
              <Link to="/inventory" className="text-gray-300 hover:text-white transition-colors">
                Inventario
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#2a475e] to-[#1b2838] rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <User className="text-white" size={64} />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-white text-3xl font-bold mb-2">
                {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario'}
              </h1>
              <div className="flex flex-col md:flex-row gap-4 text-gray-400">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Calendar size={16} />
                  <span>Miembro desde {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-center flex-wrap">
              <div className="bg-[#1b2838]/50 px-4 py-3 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {inventoryLoading ? '...' : inventory?.length || 0}
                </div>
                <div className="text-gray-400 text-xs">Items</div>
              </div>
              <div className="bg-[#1b2838]/50 px-4 py-3 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {inventoryLoading ? '...' : tradeableCount}
                </div>
                <div className="text-gray-400 text-xs">Intercambiables</div>
              </div>
              <div className="bg-[#1b2838]/50 px-4 py-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {inventoryLoading ? '...' : marketableCount}
                </div>
                <div className="text-gray-400 text-xs">Vendibles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#2a475e] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#2a475e] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'wallet'
                ? 'bg-[#2a475e] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet size={16} />
            Billetera
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-[#2a475e] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-[#2a475e] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={16} />
            Privacidad
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Links */}
            <div className="bg-[#16202d] rounded-xl p-6">
              <h2 className="text-white text-xl font-bold mb-4">Acceso Rápido</h2>
              <div className="space-y-3">
                <Link
                  to="/inventory"
                  className="flex items-center justify-between p-4 bg-[#1b2838] rounded-lg hover:bg-[#2a475e] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Package className="text-blue-400" size={24} />
                    <div>
                      <div className="text-white font-medium">Mi Inventario</div>
                      <div className="text-gray-400 text-sm">
                        {inventoryLoading ? 'Cargando...' : `${inventory?.length || 0} items`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </Link>

                <div className="flex items-center justify-between p-4 bg-[#1b2838] rounded-lg opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <Settings className="text-gray-400" size={24} />
                    <div>
                      <div className="text-white font-medium">Configuración</div>
                      <div className="text-gray-400 text-sm">Próximamente</div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </div>

                <button
                  onClick={() => setActiveTab('privacy')}
                  className="w-full flex items-center justify-between p-4 bg-[#1b2838] rounded-lg hover:bg-[#2a475e] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="text-purple-400" size={24} />
                    <div className="text-left">
                      <div className="text-white font-medium">Privacidad</div>
                      <div className="text-gray-400 text-sm">Configura tu privacidad</div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
                </button>
              </div>
            </div>

            {/* Recent Items Preview */}
            <div className="bg-[#16202d] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Items Recientes</h2>
                <Link to="/inventory" className="text-blue-400 hover:text-blue-300 text-sm">
                  Ver todos →
                </Link>
              </div>
              
              {inventoryLoading ? (
                <div className="text-gray-400 text-center py-8">Cargando...</div>
              ) : inventory && inventory.length > 0 ? (
                <div className="space-y-3">
                  {inventory.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-[#1b2838] rounded-lg">
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <Package size={20} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">Item #{item.steam_item_id}</div>
                        <div className="flex gap-2 mt-1">
                          {item.is_tradeable && !item.is_locked && (
                            <span className="text-green-400 text-xs flex items-center gap-1">
                              <RefreshCw size={10} /> Intercambiable
                            </span>
                          )}
                          {item.is_marketable && !item.is_locked && (
                            <span className="text-blue-400 text-xs flex items-center gap-1">
                              <TrendingUp size={10} /> Vendible
                            </span>
                          )}
                          {item.is_locked && (
                            <span className="text-red-400 text-xs flex items-center gap-1">
                              <Lock size={10} /> Bloqueado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  <Package className="mx-auto mb-2 opacity-50" size={48} />
                  <p>Tu inventario está vacío</p>
                  <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                    Explorar la tienda →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <WalletCard />
        )}

        {activeTab === 'inventory' && (
          <div className="bg-[#16202d] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Mi Inventario</h2>
              <Link
                to="/inventory"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Package size={18} />
                Ver Inventario Completo
              </Link>
            </div>

            {inventoryLoading ? (
              <div className="text-gray-400 text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                Cargando inventario...
              </div>
            ) : inventory && inventory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {inventory.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#1b2838] rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors relative"
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Package size={24} className="text-gray-500" />
                    </div>
                    {/* Status indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {item.is_locked && (
                        <div className="bg-red-500/80 p-1 rounded" title="Bloqueado">
                          <Lock size={10} className="text-white" />
                        </div>
                      )}
                      {item.is_tradeable && !item.is_locked && (
                        <div className="bg-green-500/80 p-1 rounded" title="Intercambiable">
                          <RefreshCw size={10} className="text-white" />
                        </div>
                      )}
                      {item.is_marketable && !item.is_locked && (
                        <div className="bg-blue-500/80 p-1 rounded" title="Vendible">
                          <TrendingUp size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h3 className="text-white text-xs font-medium truncate">Item #{item.steam_item_id}</h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-12">
                <Package className="mx-auto mb-4 opacity-50" size={64} />
                <p className="text-lg mb-2">Tu inventario está vacío</p>
                <p className="text-sm mb-4">¡Explora la tienda y adquiere tu primer item!</p>
                <Link
                  to="/"
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg transition-colors inline-block"
                >
                  Ir a la Tienda
                </Link>
              </div>
            )}

            {inventory && inventory.length > 12 && (
              <div className="text-center mt-6">
                <Link
                  to="/inventory"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Ver los {inventory.length - 12} items restantes →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <PrivacySettings />
        )}
      </div>
    </div>
  );
};
