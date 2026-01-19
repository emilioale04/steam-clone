import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Mail, 
  Settings, 
  Users, 
  MessageSquare, 
  Store, 
  Library, 
  ChevronRight,
  Plus,
  Filter,
  ChevronDown,
  UserPlus,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import FeaturedCommunityBanner from '../components/FeaturedCommunityBanner';
import GroupCardExplorer from '../components/GroupCardExplorer';
import FriendsSidebar from '../components/FriendsSidebar';
import YourGroupsSidebar from '../components/YourGroupsSidebar';
import RecommendedSection from '../components/RecommendedSection';

// Datos de grupos públicos para explorar (estos vendrán del API)
const publicGroups = [
  {
    id: 'test-group',
    name: 'Grupo Simulado (Test)',
    description: 'Grupo de prueba para testear el flujo de navegación. ¡Haz clic para ver el detalle!',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
    memberCount: '12,405',
    type: 'PUBLIC',
    icon: '🎮'
  },
  {
    id: 'eternal-knights',
    name: 'Eternal Knights RPG',
    description: 'Dedicated to classic RPG discussion and LFG.',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=200&fit=crop',
    memberCount: '24k',
    type: 'PUBLIC',
    icon: '⚔️'
  },
  {
    id: 'tactical-ops',
    name: 'Tactical Ops Elite',
    description: 'Competitive FPS clan for high-rank players.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
    memberCount: '850',
    type: 'RESTRICTED',
    icon: '🎯'
  },
  {
    id: 'drift-kings',
    name: 'Drift Kings Global',
    description: 'Official hub for sim-racing enthusiasts.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
    memberCount: '156k',
    type: 'PUBLIC',
    icon: '🏎️'
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art Masters',
    description: 'Share your retro-style artwork and game assets.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&fit=crop',
    memberCount: '12k',
    type: 'PUBLIC',
    icon: '🎨'
  },
  {
    id: 'horror-games',
    name: 'Horror Games Society',
    description: 'For fans of survival horror and psychological thrillers.',
    image: 'https://images.unsplash.com/photo-1509248961895-e00e5c19b384?w=400&h=200&fit=crop',
    memberCount: '8.5k',
    type: 'PUBLIC',
    icon: '👻'
  },
  {
    id: 'valorant-league',
    name: 'Pro League Valorant',
    description: 'Competitive Valorant teams and scrims.',
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=200&fit=crop',
    memberCount: '2.1k',
    type: 'RESTRICTED',
    icon: '🎮'
  }
];

const featuredCommunity = {
  name: 'The Space Explorers',
  description: 'Join the largest community of galactic adventurers. Regular events, trading hubs, and weekly tournaments for all major...',
  image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=400&fit=crop',
  onlineCount: '1,204',
  memberCount: '128,405'
};

// Tabs definidos dinámicamente dentro del componente

const filterTabs = [
  { id: 'all', label: 'All Groups' },
  { id: 'official', label: 'Official Hubs' },
  { id: 'local', label: 'Local' },
  { id: 'friends', label: "Friends' Groups" }
];

export const CommunityPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  
  // Estados dinámicos (vacíos por defecto - se llenarán desde el API)
  const [myGroups, setMyGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [invites, setInvites] = useState([]);
  const [chatNotifications, setChatNotifications] = useState(0);

  // Tabs con contador dinámico de invitaciones
  const tabs = [
    { id: 'myGroups', label: 'My Groups' },
    { id: 'browse', label: 'Browse Groups' },
    { id: 'invites', label: 'Invites', count: invites.length > 0 ? invites.length : null }
  ];

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myGroups':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#2a3f5f] rounded-full flex items-center justify-center mb-6">
              <Users size={40} className="text-gray-400" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No eres miembro de ningún grupo</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">
              Únete a grupos para conectar con otros jugadores, participar en discusiones y encontrar compañeros de juego.
            </p>
            <button 
              onClick={() => setActiveTab('browse')}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors"
            >
              Explorar Grupos
            </button>
          </div>
        );

      case 'invites':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#2a3f5f] rounded-full flex items-center justify-center mb-6">
              <Inbox size={40} className="text-gray-400" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No tienes invitaciones pendientes</h3>
            <p className="text-gray-400 text-center max-w-md">
              Cuando alguien te invite a un grupo, aparecerá aquí.
            </p>
          </div>
        );

      case 'browse':
      default:
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Sidebar - Your Groups & Recommended */}
            <div className="xl:col-span-1 space-y-6">
              <YourGroupsSidebar 
                groups={myGroups} 
                onViewAllClick={() => setActiveTab('myGroups')}
              />
              <RecommendedSection recommendedGroups={[]} />
            </div>

            {/* Right Content - Featured & Groups Grid */}
            <div className="xl:col-span-3 space-y-6">
              {/* Featured Community Banner */}
              <FeaturedCommunityBanner community={featuredCommunity} />

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {filterTabs.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        activeFilter === filter.id
                          ? 'bg-[#2a3f5f] text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#2a3f5f]/50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="popularity">Sort by: Popularity</option>
                      <option value="newest">Sort by: Newest</option>
                      <option value="members">Sort by: Members</option>
                      <option value="activity">Sort by: Activity</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button className="p-2 bg-[#2a3f5f] border border-[#3a5070] rounded text-gray-400 hover:text-white transition-colors">
                    <Filter size={16} />
                  </button>
                </div>
              </div>

              {/* Groups Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicGroups.map((group) => (
                  <GroupCardExplorer key={group.id} group={group} />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#1b2838] flex">
      {/* Sidebar izquierdo */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#171a21] border-r border-[#2a3f5f] flex-shrink-0">
        {/* User Info */}
        <div className="p-4 border-b border-[#2a3f5f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.username || 'Usuario'}</p>
              {user?.wallet_balance !== undefined && user?.wallet_balance !== null ? (
                <p className="text-gray-400 text-xs">Wallet: ${Number(user.wallet_balance).toFixed(2)}</p>
              ) : (
                <p className="text-gray-400 text-xs">Wallet: $0.00</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <NavItem to="/store" icon={<Store size={18} />} label="Store" />
          <NavItem to="/library" icon={<Library size={18} />} label="Library" />
          <NavItem to="/community" icon={<Users size={18} />} label="Community" active />
          <NavItem to="/chat" icon={<MessageSquare size={18} />} label="Chat" badge={chatNotifications > 0 ? chatNotifications : null} />
        </nav>

        {/* Friends List */}
        <FriendsSidebar friends={friends} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-[#171a21] border-b border-[#2a3f5f] px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <h1 className="text-white font-semibold text-lg">Groups & Communities</h1>
            </div>

            {/* Top Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink 
                to="/community" 
                end
                className={({ isActive }) => 
                  isActive 
                    ? "px-4 py-1.5 bg-[#2a3f5f] text-white text-sm rounded-full font-medium hover:bg-[#3a5070] transition-colors cursor-pointer"
                    : "text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/community/discussions" 
                className={({ isActive }) => 
                  isActive 
                    ? "px-4 py-1.5 bg-[#2a3f5f] text-white text-sm rounded-full font-medium hover:bg-[#3a5070] transition-colors cursor-pointer"
                    : "text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
                }
              >
                Discussions
              </NavLink>
              <NavLink 
                to="/workshop" 
                className={({ isActive }) => 
                  isActive 
                    ? "px-4 py-1.5 bg-[#2a3f5f] text-white text-sm rounded-full font-medium hover:bg-[#3a5070] transition-colors cursor-pointer"
                    : "text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
                }
              >
                Workshop
              </NavLink>
              <NavLink 
                to="/market" 
                className={({ isActive }) => 
                  isActive 
                    ? "px-4 py-1.5 bg-[#2a3f5f] text-white text-sm rounded-full font-medium hover:bg-[#3a5070] transition-colors cursor-pointer"
                    : "text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
                }
              >
                Market
              </NavLink>
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
              <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2">Find Your Community</h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Browse thousands of groups to find players with similar interests, join official game hubs, or create your own clan.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 sm:gap-6 border-b border-[#2a3f5f] overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
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

              <Link 
                to="/groups/create"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors flex-shrink-0"
              >
                <Plus size={16} />
                Create Group
              </Link>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Settings Button (fixed) */}
      <Link 
        to="/settings"
        className="fixed bottom-6 left-6 p-3 bg-[#2a3f5f] rounded-full text-gray-400 hover:text-white hover:bg-[#3a5070] transition-colors shadow-lg z-50"
      >
        <Settings size={20} />
      </Link>
    </div>
  );
};

// Navigation Item Component con Link de react-router-dom
const NavItem = ({ to, icon, label, active = false, badge = null }) => (
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

export default CommunityPage;
