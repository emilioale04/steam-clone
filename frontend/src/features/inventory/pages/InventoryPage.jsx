import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Gamepad2, ArrowLeft, Search, Filter, Grid, List, Lock, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useInventory } from '../hooks/useInventory';

export const InventoryPage = () => {
  const { user } = useAuth();
  const { inventory, loading, error, refetch } = useInventory(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('id'); // 'id', 'tradeable', 'marketable'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'tradeable', 'marketable', 'locked'

  // Filter and sort inventory
  const filteredInventory = inventory
    ?.filter((item) => {
      // Search filter
      const matchesSearch = item.steam_item_id?.toString().includes(searchTerm);
      
      // Status filter
      if (filterBy === 'tradeable') return matchesSearch && item.is_tradeable && !item.is_locked;
      if (filterBy === 'marketable') return matchesSearch && item.is_marketable && !item.is_locked;
      if (filterBy === 'locked') return matchesSearch && item.is_locked;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'tradeable') {
        return (b.is_tradeable ? 1 : 0) - (a.is_tradeable ? 1 : 0);
      }
      if (sortBy === 'marketable') {
        return (b.is_marketable ? 1 : 0) - (a.is_marketable ? 1 : 0);
      }
      // Default: sort by steam_item_id
      return (a.steam_item_id || 0) - (b.steam_item_id || 0);
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Cargando inventario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Gamepad2 className="text-white" size={24} />
                </div>
                <span className="text-white text-xl font-bold hidden sm:block">Steam Clone</span>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/profile" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={18} />
                Volver al Perfil
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold flex items-center gap-3">
              <Package className="text-blue-400" size={32} />
              Mi Inventario
            </h1>
            <p className="text-gray-400 mt-1">
              {filteredInventory.length} {filteredInventory.length === 1 ? 'item' : 'items'} en tu colección
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#16202d] rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por Steam Item ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#1b2838] text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
              />
            </div>

            {/* Filter by status */}
            <div className="flex items-center gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-[#1b2838] text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los items</option>
                <option value="tradeable">Intercambiables</option>
                <option value="marketable">Vendibles</option>
                <option value="locked">Bloqueados</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1b2838] text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="id">Steam Item ID</option>
                <option value="tradeable">Intercambiables primero</option>
                <option value="marketable">Vendibles primero</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#1b2838] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6">
            <p>Error al cargar el inventario: {error}</p>
            <button
              onClick={() => refetch()}
              className="text-red-300 hover:text-red-200 underline mt-2"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredInventory.length === 0 && (
          <div className="bg-[#16202d] rounded-xl p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-500" size={80} />
            {searchTerm ? (
              <>
                <h2 className="text-white text-xl font-bold mb-2">Sin resultados</h2>
                <p className="text-gray-400 mb-4">
                  No se encontraron items que coincidan con "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <h2 className="text-white text-xl font-bold mb-2">Tu inventario está vacío</h2>
                <p className="text-gray-400 mb-6">
                  ¡Explora la tienda y comienza a construir tu colección de items!
                </p>
                <Link
                  to="/"
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg transition-colors inline-block"
                >
                  Explorar la Tienda
                </Link>
              </>
            )}
          </div>
        )}

        {/* Grid View */}
        {!error && filteredInventory.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="bg-[#16202d] rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-[1.02] cursor-pointer group relative"
              >
                <div className="relative aspect-square bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <Package className="text-gray-500" size={48} />
                  {/* Status indicators */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {item.is_locked && (
                      <div className="bg-red-500/90 p-1.5 rounded" title="Bloqueado">
                        <Lock size={14} className="text-white" />
                      </div>
                    )}
                    {item.is_tradeable && !item.is_locked && (
                      <div className="bg-green-500/90 p-1.5 rounded" title="Intercambiable">
                        <RefreshCw size={14} className="text-white" />
                      </div>
                    )}
                    {item.is_marketable && !item.is_locked && (
                      <div className="bg-blue-500/90 p-1.5 rounded" title="Vendible">
                        <TrendingUp size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">
                    Item #{item.steam_item_id}
                  </h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.is_tradeable && !item.is_locked && (
                      <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded">Intercambiable</span>
                    )}
                    {item.is_marketable && !item.is_locked && (
                      <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-0.5 rounded">Vendible</span>
                    )}
                    {item.is_locked && (
                      <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded">Bloqueado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!error && filteredInventory.length > 0 && viewMode === 'list' && (
          <div className="bg-[#16202d] rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#1b2838] text-gray-400 text-sm font-medium">
              <div className="col-span-1"></div>
              <div className="col-span-3">Steam Item ID</div>
              <div className="col-span-3">Estado</div>
              <div className="col-span-5">Propiedades</div>
            </div>
            <div className="divide-y divide-gray-700">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-[#1b2838] transition-colors cursor-pointer items-center"
                >
                  <div className="md:col-span-1">
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Package size={20} className="text-gray-500" />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="text-white font-medium">Item #{item.steam_item_id}</h3>
                  </div>
                  <div className="md:col-span-3">
                    {item.is_locked ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <Lock size={14} /> Bloqueado
                      </span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1">
                        Disponible
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <div className="flex gap-2 flex-wrap">
                      {item.is_tradeable && (
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.is_locked ? 'text-gray-500 bg-gray-500/10' : 'text-green-400 bg-green-400/10'}`}>
                          <RefreshCw size={12} /> Intercambiable
                        </span>
                      )}
                      {item.is_marketable && (
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.is_locked ? 'text-gray-500 bg-gray-500/10' : 'text-blue-400 bg-blue-400/10'}`}>
                          <TrendingUp size={12} /> Vendible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {!error && filteredInventory.length > 0 && (
          <div className="mt-8 bg-[#16202d] rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400">{filteredInventory.length}</div>
                <div className="text-gray-400 text-sm">Total de items</div>
              </div>
              <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400">
                  {filteredInventory.filter(item => item.is_tradeable && !item.is_locked).length}
                </div>
                <div className="text-gray-400 text-sm">Intercambiables</div>
              </div>
              <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {filteredInventory.filter(item => item.is_marketable && !item.is_locked).length}
                </div>
                <div className="text-gray-400 text-sm">Vendibles</div>
              </div>
              <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-400">
                  {filteredInventory.filter(item => item.is_locked).length}
                </div>
                <div className="text-gray-400 text-sm">Bloqueados</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
