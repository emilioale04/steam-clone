import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Mail, 
  Settings, 
  Users, 
  Store, 
  Library, 
  ChevronRight,
  Plus,
  ChevronDown,
  AlertCircle,
  Loader2
} from 'lucide-react';
import GroupCardExplorer from '../components/GroupCardExplorer';
import RecommendedSection from '../components/RecommendedSection';
import GroupConsentModal from '../components/GroupConsentModal';
import { consentService } from '../services/consentService';
import { useAuth } from '../../../shared/context/AuthContext';

const tabs = [
  { id: 'my-groups', label: 'My Groups' },
  { id: 'browse', label: 'Browse Groups' },
  { id: 'invites', label: 'Invites' }
];

// Helper para formatear el conteo de miembros
const formatMemberCount = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

// Mapear visibilidad del backend a tipo del frontend
const mapVisibilityToType = (visibilidad) => {
  switch (visibilidad) {
    case 'Open':
      return 'PUBLIC';
    case 'Restricted':
      return 'RESTRICTED';
    case 'Closed':
      return 'PRIVATE';
    default:
      return 'PUBLIC';
  }
};

// Mapear respuesta de la API al formato esperado por GroupCardExplorer
const mapApiGroupToCardFormat = (apiGroup) => ({
  id: apiGroup.id,
  name: apiGroup.nombre,
  description: apiGroup.descripcion || '',
  image: apiGroup.avatar_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
  memberCount: formatMemberCount(apiGroup.member_count || 0),
  type: mapVisibilityToType(apiGroup.visibilidad),
  icon: '🎮' // Icono por defecto - podría venir del backend en el futuro
});

// Colores para avatares de grupos
const groupColors = ['bg-orange-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-cyan-500'];

// Mapear respuesta de my-groups al formato del sidebar
const mapMyGroupToSidebarFormat = (apiGroup, index) => {
  const grupo = apiGroup.grupos || apiGroup;
  return {
    id: grupo.id,
    name: grupo.nombre,
    subtitle: `${grupo.member_count || 0} miembros`,
    avatar: '🎮',
    color: groupColors[index % groupColors.length]
  };
};

export const CommunityExplorerPage = () => {
  // Estados para grupos públicos desde la API
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para datos personales del Sidebar
  const [myGroups, setMyGroups] = useState([]);
  const [myGroupsLoading, setMyGroupsLoading] = useState(false);
  
  // Estado para mensajes toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Estado para tracking de grupos con solicitud pendiente
  const [pendingRequests, setPendingRequests] = useState(new Set());

  // Estados para consentimiento
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingJoinGroupId, setPendingJoinGroupId] = useState(null);
  const [pendingJoinGroupType, setPendingJoinGroupType] = useState(null);

  // FETCH FORZADO - SE EJECUTA INMEDIATAMENTE AL MONTAR
  useEffect(() => {
    console.log('🚀 INICIANDO CARGA FORZADA DE GRUPOS...');

    fetch('http://localhost:3000/api/community/groups/search', {
      credentials: 'include'
    })
      .then(async (res) => {
        console.log(`📡 Status API: ${res.status}`);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        console.log('📦 DATOS RECIBIDOS (Crudos):', data);
        return data;
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mappedGroups = data.data.map(mapApiGroupToCardFormat);
          console.log('✅ Grupos mapeados:', mappedGroups);
          setGroups(mappedGroups);
        } else {
          console.log('⚠️ No hay grupos o formato inesperado');
          setGroups([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ ERROR FATAL EN FETCH:', err);
        setError(err.message);
        setGroups([]);
        setLoading(false);
      });
  }, []); // Array vacío = Ejecutar al montar SIEMPRE

  // Auth context - después del useEffect crítico
  const { user } = useAuth();

  // Fetch de "Mis Grupos" cuando el usuario está autenticado
  useEffect(() => {
    if (!user) {
      setMyGroups([]);
      return;
    }

    console.log('👤 Usuario autenticado, cargando mis grupos...');
    setMyGroupsLoading(true);

    fetch('http://localhost:3000/api/community/groups/my-groups', {
      credentials: 'include'
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('📦 Mis grupos (raw):', data);
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(mapMyGroupToSidebarFormat);
          console.log('✅ Mis grupos mapeados:', mapped);
          setMyGroups(mapped);
        } else {
          setMyGroups([]);
        }
      })
      .catch((err) => {
        console.error('❌ Error cargando mis grupos:', err);
        setMyGroups([]);
      })
      .finally(() => setMyGroupsLoading(false));
  }, [user]);

  // Verificar estado de consentimiento cuando el usuario está autenticado
  useEffect(() => {
    if (!user) {
      setHasConsent(false);
      return;
    }

    const checkConsent = async () => {
      try {
        const result = await consentService.checkConsent();
        setHasConsent(result.data?.hasConsent || false);
        console.log('📋 Estado de consentimiento:', result.data?.hasConsent);
      } catch (error) {
        console.error('Error verificando consentimiento:', error);
        setHasConsent(false);
      }
    };

    checkConsent();
  }, [user]);

  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');

  // Función para ordenar grupos según el criterio seleccionado
  const getSortedGroups = (groupsToSort) => {
    if (!groupsToSort || groupsToSort.length === 0) return [];
    
    const sorted = [...groupsToSort];
    
    switch (sortBy) {
      case 'popularity':
      case 'members':
        // Ordenar por memberCount descendente
        return sorted.sort((a, b) => {
          const countA = parseInt(a.memberCount?.replace(/[^0-9]/g, '') || '0');
          const countB = parseInt(b.memberCount?.replace(/[^0-9]/g, '') || '0');
          return countB - countA;
        });
      case 'newest':
        // Ordenar por ID descendente (asumiendo que IDs más altos = más nuevos)
        return sorted.sort((a, b) => {
          const idA = typeof a.id === 'string' ? a.id : String(a.id);
          const idB = typeof b.id === 'string' ? b.id : String(b.id);
          return idB.localeCompare(idA);
        });
      case 'alphabetical':
        // Ordenar alfabéticamente por nombre
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  // Función para unirse a un grupo
  const handleJoinGroup = async (groupId, groupType) => {
    if (!user) {
      setToast({ show: true, message: 'Debes iniciar sesión para unirte a un grupo', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    // Verificar si el usuario tiene consentimiento activo
    if (!hasConsent) {
      // Guardar el grupo pendiente y mostrar modal de consentimiento
      setPendingJoinGroupId(groupId);
      setPendingJoinGroupType(groupType);
      setShowConsentModal(true);
      return;
    }

    // Proceder con la unión al grupo
    await performJoinGroup(groupId, groupType);
  };

  // Función que ejecuta la unión al grupo (después de verificar consentimiento)
  const performJoinGroup = async (groupId, groupType) => {
    try {
      const response = await fetch(`http://localhost:3000/api/community/groups/${groupId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al unirse al grupo');
      }

      // Manejar respuesta según el tipo de grupo
      if (data.data?.status === 'joined') {
        // Unión directa exitosa (PUBLIC)
        setToast({ show: true, message: '¡Te has unido al grupo exitosamente!', type: 'success' });
        
        // Agregar a myGroups
        const joinedGroup = groups.find(g => g.id === groupId);
        if (joinedGroup) {
          const newMyGroup = {
            id: joinedGroup.id,
            name: joinedGroup.name,
            subtitle: `${joinedGroup.memberCount} miembros`,
            avatar: joinedGroup.icon || '🎮',
            color: groupColors[myGroups.length % groupColors.length]
          };
          setMyGroups(prev => [...prev, newMyGroup]);
        }
      } else if (data.data?.status === 'pending') {
        // Solicitud enviada (RESTRICTED)
        setToast({ show: true, message: 'Solicitud enviada. Espera la aprobación del administrador.', type: 'info' });
        setPendingRequests(prev => new Set([...prev, groupId]));
      }

      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Error al unirse al grupo:', error);
      setToast({ show: true, message: error.message || 'Error al procesar la solicitud', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  // Manejar aceptación de consentimiento
  const handleConsentAccept = async () => {
    try {
      await consentService.grantConsent();
      setHasConsent(true);
      setShowConsentModal(false);
      
      // Continuar con la unión al grupo pendiente
      if (pendingJoinGroupId) {
        await performJoinGroup(pendingJoinGroupId, pendingJoinGroupType);
        setPendingJoinGroupId(null);
        setPendingJoinGroupType(null);
      }
    } catch (error) {
      console.error('Error al guardar consentimiento:', error);
      setToast({ show: true, message: 'Error al guardar el consentimiento', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  // Manejar rechazo de consentimiento
  const handleConsentReject = () => {
    setShowConsentModal(false);
    setPendingJoinGroupId(null);
    setPendingJoinGroupType(null);
    setToast({ show: true, message: 'Debes aceptar los términos para unirte a grupos', type: 'info' });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Verificar si el usuario ya es miembro de un grupo
  const isUserMember = (groupId) => {
    return myGroups.some(g => g.id === groupId);
  };

  // Verificar si hay solicitud pendiente
  const hasPendingRequest = (groupId) => {
    return pendingRequests.has(groupId);
  };

  return (
    <div className="min-h-screen bg-[#1b2838] flex">
      {/* Sidebar izquierdo */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#171a21] border-r border-[#2a3f5f]">
        {/* User Info */}
        <div className="p-4 border-b border-[#2a3f5f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-bold">
                  {(user?.user_metadata?.username || user?.email || 'G').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {user?.user_metadata?.username || (user?.email ? user.email.split('@')[0] : 'Guest')}
              </p>
              <p className="text-gray-400 text-xs">
                {user ? 'Online' : 'Not logged in'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <NavLink to="/marketplace" icon={<Store size={18} />} label="Store" />
          <NavLink to="/inventory" icon={<Library size={18} />} label="Library" />
          <NavLink to="/community" icon={<Users size={18} />} label="Community" active />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-[#171a21] border-b border-[#2a3f5f] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <h1 className="text-white font-semibold text-lg">Groups & Communities</h1>
            </div>

            {/* Top Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button className="px-4 py-1.5 bg-[#2a3f5f] text-white text-sm rounded-full font-medium hover:bg-[#3a5070] transition-colors">
                Home
              </button>
              <button className="text-gray-400 text-sm hover:text-white transition-colors">
                Discussions
              </button>
              <button className="text-gray-400 text-sm hover:text-white transition-colors">
                Workshop
              </button>
              <button className="text-gray-400 text-sm hover:text-white transition-colors">
                Market
              </button>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-40"
                />
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Mail size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-white text-3xl font-bold mb-2">Find Your Community</h2>
              <p className="text-gray-400">
                Browse thousands of groups to find players with similar interests, join official game hubs, or create your own clan.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6 border-b border-[#2a3f5f]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {tab.count && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors">
                <Plus size={16} />
                Create Group
              </button>
            </div>

            {/* Main Grid */}
            <div className={`grid grid-cols-1 ${activeTab === 'browse' ? 'xl:grid-cols-4' : ''} gap-6`}>
              {/* Left Sidebar - Recommended (Solo en Browse) */}
              {activeTab === 'browse' && (
                <div className="xl:col-span-1 space-y-6">
                  <RecommendedSection recommendedGroups={groups.slice(0, 3)} loading={loading} />
                </div>
              )}

              {/* Right Content - Groups Grid */}
              <div className={activeTab === 'browse' ? 'xl:col-span-3 space-y-6' : 'space-y-6'}>
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">
                    {activeTab === 'browse' ? 'All Groups' : activeTab === 'my-groups' ? 'My Groups' : 'Invitations'}
                  </h3>
                  {activeTab !== 'invites' && (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="appearance-none pl-4 pr-10 py-2 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="popularity">Sort by: Popularity</option>
                          <option value="newest">Sort by: Newest</option>
                          <option value="alphabetical">Sort by: A-Z</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content based on activeTab */}
                {activeTab === 'browse' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Cargando grupos...</p>
                      </div>
                    ) : error ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <AlertCircle size={40} className="text-red-500 mb-4" />
                        <p className="text-red-400 mb-2">Error al cargar los grupos</p>
                        <p className="text-gray-500 text-sm">{error}</p>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-[#16202d] rounded-xl border border-[#2a3f5f]">
                        <Users size={48} className="text-gray-500 mb-4" />
                        <p className="text-white font-medium text-lg mb-2">No se encontraron grupos</p>
                        <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                          ¡Sé el primero en crear un grupo y comenzar una comunidad!
                        </p>
                        <button className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors">
                          <Plus size={18} />
                          Crear el primer grupo
                        </button>
                      </div>
                    ) : (
                      getSortedGroups(groups).map((group) => (
                        <GroupCardExplorer 
                          key={group.id} 
                          group={group}
                          onJoin={handleJoinGroup}
                          isMember={isUserMember(group.id)}
                          isPending={hasPendingRequest(group.id)}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'my-groups' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroupsLoading ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Cargando tus grupos...</p>
                      </div>
                    ) : !user ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-[#16202d] rounded-xl border border-[#2a3f5f]">
                        <Users size={48} className="text-gray-500 mb-4" />
                        <p className="text-white font-medium text-lg mb-2">Inicia sesión</p>
                        <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                          Debes iniciar sesión para ver tus grupos.
                        </p>
                        <Link to="/auth/login" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors">
                          Iniciar sesión
                        </Link>
                      </div>
                    ) : myGroups.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-[#16202d] rounded-xl border border-[#2a3f5f]">
                        <Users size={48} className="text-gray-500 mb-4" />
                        <p className="text-white font-medium text-lg mb-2">No te has unido a ningún grupo aún</p>
                        <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                          Explora la comunidad y únete a grupos que compartan tus intereses.
                        </p>
                        <button 
                          onClick={() => setActiveTab('browse')}
                          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
                        >
                          <Search size={18} />
                          Explorar grupos
                        </button>
                      </div>
                    ) : (
                      getSortedGroups(myGroups.map(g => ({
                        id: g.id,
                        name: g.name,
                        description: g.subtitle,
                        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
                        memberCount: g.subtitle?.replace(' miembros', '') || '0',
                        type: 'MEMBER',
                        icon: g.avatar
                      }))).map((group) => (
                        <GroupCardExplorer 
                          key={group.id} 
                          group={group}
                          isMember={true}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'invites' && (
                  <div className="flex flex-col items-center justify-center py-16 bg-[#16202d] rounded-xl border border-[#2a3f5f]">
                    <Mail size={48} className="text-gray-500 mb-4" />
                    <p className="text-white font-medium text-lg mb-2">No tienes invitaciones pendientes</p>
                    <p className="text-gray-400 text-sm text-center max-w-md">
                      Cuando alguien te invite a un grupo, aparecerá aquí.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Button (fixed) */}
      <button className="fixed bottom-6 left-6 p-3 bg-[#2a3f5f] rounded-full text-gray-400 hover:text-white hover:bg-[#3a5070] transition-colors shadow-lg">
        <Settings size={20} />
      </button>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 
          'bg-blue-600'
        }`}>
          <span className="text-white font-medium">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal de Consentimiento */}
      <GroupConsentModal
        isOpen={showConsentModal}
        onClose={handleConsentReject}
        onAccept={handleConsentAccept}
        onReject={handleConsentReject}
        groupName={pendingJoinGroupId ? groups.find(g => g.id === pendingJoinGroupId)?.name : null}
      />
    </div>
  );
};

// Navigation Link Component
const NavLink = ({ to, icon, label, active = false, badge = null }) => (
  <Link
    to={to}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-[#2a3f5f] text-white'
        : 'text-gray-400 hover:text-white hover:bg-[#2a3f5f]/50'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge && (
      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

export default CommunityExplorerPage;
