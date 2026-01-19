/**
 * Página de Mis Aplicaciones - Frontend
 * Feature: Mis Aplicaciones (Steamworks Dashboard)
 * 
 * Muestra las aplicaciones del desarrollador autenticado con:
 * - Tarjetas de aplicación con estado, precio y acciones
 * - Filtro por estado de revisión
 * - Búsqueda por nombre
 * - Botón "Editar Tienda" para aplicaciones aprobadas
 */

import { useState, useEffect } from 'react';
import { myAppsService } from '../services/myAppsService';
import { Loader2, Search, Filter, Store, AlertCircle, Package, CheckCircle, Clock, XCircle, Edit } from 'lucide-react';

/**
 * Componente de tarjeta de aplicación
 */
const AppCard = ({ app, onEditStore }) => {
  // Determinar el color y texto del estado
  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'aprobado':
        return { color: 'bg-green-600', text: 'Aprobado', icon: CheckCircle };
      case 'en_revision':
        return { color: 'bg-yellow-600', text: 'En Revisión', icon: Clock };
      case 'rechazado':
        return { color: 'bg-red-600', text: 'Rechazado', icon: XCircle };
      case 'publicado':
        return { color: 'bg-blue-600', text: 'Publicado', icon: Store };
      case 'borrador':
      default:
        return { color: 'bg-gray-600', text: 'Borrador', icon: Edit };
    }
  };

  const estadoInfo = getEstadoInfo(app.estado_revision);
  const EstadoIcon = estadoInfo.icon;

  // Formatear precio
  const formatPrecio = (precio) => {
    if (precio === null || precio === undefined) {
      return 'Sin precio establecido';
    }
    if (precio === 0) {
      return 'Gratis';
    }
    return `$${parseFloat(precio).toFixed(2)} USD`;
  };

  return (
    <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 hover:border-[#66c0f4] transition-colors">
      {/* Header de la tarjeta */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{app.nombre_juego}</h3>
          <p className="text-sm text-gray-400">AppID: {app.app_id}</p>
        </div>
        <span className={`${estadoInfo.color} px-3 py-1 rounded-full text-xs text-white flex items-center gap-1`}>
          <EstadoIcon size={12} />
          {estadoInfo.text}
        </span>
      </div>

      {/* Descripción corta */}
      {app.descripcion_corta && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {app.descripcion_corta}
        </p>
      )}

      {/* Precio */}
      <div className="mb-4">
        <span className={`text-lg font-semibold ${app.precio_base_usd > 0 ? 'text-[#66c0f4]' : 'text-gray-400'}`}>
          {formatPrecio(app.precio_base_usd)}
        </span>
      </div>

      {/* Etiquetas */}
      {app.etiquetas && app.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {app.etiquetas.slice(0, 3).map((etiqueta, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-[#2a3f5f] text-xs text-gray-300 rounded"
            >
              {etiqueta}
            </span>
          ))}
          {app.etiquetas.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-400">
              +{app.etiquetas.length - 3} más
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-4 border-t border-[#2a3f5f]">
        {(app.estado_revision === 'aprobado' || app.estado_revision === 'publicado') && (
          <button
            onClick={() => onEditStore(app)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#66c0f4] text-white rounded hover:bg-[#4fa3d7] transition-colors font-medium"
          >
            <Store size={16} />
            Editar Tienda
          </button>
        )}
        {app.estado_revision === 'en_revision' && (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded">
            <Clock size={16} />
            Esperando aprobación
          </div>
        )}
        {app.estado_revision === 'rechazado' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-2 bg-red-600/20 text-red-400 rounded">
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              Rechazado
            </div>
            {app.notas_revision && (
              <p className="text-xs text-center">{app.notas_revision}</p>
            )}
          </div>
        )}
        {app.estado_revision === 'borrador' && (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600/20 text-gray-400 rounded">
            <Edit size={16} />
            Borrador - Completa tu aplicación
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Página principal de Mis Aplicaciones
 */
export const MisAplicacionesPage = ({ onEditStore }) => {
  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  // Estados disponibles para filtrar
  const estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'aprobado', label: 'Aprobados' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'publicado', label: 'Publicados' },
    { value: 'rechazado', label: 'Rechazados' },
    { value: 'borrador', label: 'Borradores' },
  ];

  // Cargar aplicaciones al montar y cuando cambian los filtros
  useEffect(() => {
    cargarAplicaciones();
  }, [filtroEstado]);

  // Cargar estadísticas al montar
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarAplicaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (filtroEstado) {
        filters.estado_revision = filtroEstado;
      }
      if (busqueda.trim()) {
        filters.search = busqueda.trim();
      }

      const response = await myAppsService.obtenerAplicaciones(filters);
      setAplicaciones(response.data || []);
    } catch (err) {
      console.error('[MIS_APPS] Error al cargar aplicaciones:', err);
      setError(err.message || 'Error al cargar aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await myAppsService.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (err) {
      console.error('[MIS_APPS] Error al cargar estadísticas:', err);
    }
  };

  // Manejar búsqueda
  const handleBuscar = (e) => {
    e.preventDefault();
    cargarAplicaciones();
  };

  // Manejar click en Editar Tienda
  const handleEditStore = (app) => {
    if (onEditStore) {
      onEditStore(app);
    } else {
      // Navegar a la página de configuración de tienda
      console.log('[MIS_APPS] Editar tienda:', app.app_id);
      // TODO: Implementar navegación a configuración de tienda
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Aplicaciones</h1>
          <p className="text-gray-400">
            Gestiona tus juegos y aplicaciones registradas
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="bg-[#1e2a38] border border-green-600/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{estadisticas.aprobado}</p>
            <p className="text-xs text-gray-400">Aprobados</p>
          </div>
          <div className="bg-[#1e2a38] border border-yellow-600/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{estadisticas.en_revision}</p>
            <p className="text-xs text-gray-400">En Revisión</p>
          </div>
          <div className="bg-[#1e2a38] border border-blue-600/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{estadisticas.publicado}</p>
            <p className="text-xs text-gray-400">Publicados</p>
          </div>
          <div className="bg-[#1e2a38] border border-gray-600/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{estadisticas.borrador}</p>
            <p className="text-xs text-gray-400">Borradores</p>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <form onSubmit={handleBuscar} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-10 pr-4 py-2 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#66c0f4]"
              />
            </div>
          </form>

          {/* Filtro por estado */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={18} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white focus:outline-none focus:border-[#66c0f4]"
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#66c0f4]" size={48} />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={cargarAplicaciones}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de aplicaciones */}
      {!loading && !error && aplicaciones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aplicaciones.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onEditStore={handleEditStore}
            />
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && aplicaciones.length === 0 && (
        <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-12 text-center">
          <Package className="mx-auto text-gray-500 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">
            No tienes aplicaciones
          </h3>
          <p className="text-gray-400 mb-6">
            {filtroEstado || busqueda
              ? 'No se encontraron aplicaciones con los filtros aplicados'
              : 'Comienza creando tu primera aplicación'}
          </p>
          {(filtroEstado || busqueda) && (
            <button
              onClick={() => {
                setFiltroEstado('');
                setBusqueda('');
              }}
              className="px-4 py-2 bg-[#2a3f5f] text-gray-300 rounded hover:bg-[#3d5a80] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MisAplicacionesPage;
