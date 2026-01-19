import { useState } from 'react';
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
  Circle
} from 'lucide-react';
import FeaturedCommunityBanner from '../components/FeaturedCommunityBanner';
import GroupCardExplorer from '../components/GroupCardExplorer';
import FriendsSidebar from '../components/FriendsSidebar';
import YourGroupsSidebar from '../components/YourGroupsSidebar';
import RecommendedSection from '../components/RecommendedSection';

// Datos ficticios para los grupos
const mockGroups = [
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

const yourGroups = [
  { id: 1, name: 'CS:GO Global', subtitle: '3 new announcements...', avatar: '🎯', color: 'bg-orange-500' },
  { id: 2, name: 'Indie Game Devs', subtitle: '12 friends here', avatar: '🎮', color: 'bg-purple-500' },
  { id: 3, name: 'PC Builders', subtitle: '', avatar: '🖥️', color: 'bg-blue-500' }
];

const friends = [
  { id: 1, name: 'PixelMage', status: 'In-Game: Dota 2', online: true, inGame: true },
  { id: 2, name: 'SpeedRunner', status: 'Online', online: true, inGame: false }
];

const tabs = [
  { id: 'my-groups', label: 'My Groups' },
  { id: 'browse', label: 'Browse Groups' },
  { id: 'invites', label: 'Invites', count: 1 }
];

const filterTabs = [
  { id: 'all', label: 'All Groups' },
  { id: 'official', label: 'Official Hubs' },
  { id: 'local', label: 'Local' },
  { id: 'friends', label: "Friends' Groups" }
];

export const CommunityExplorerPage = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');

  return (
    <div className="min-h-screen bg-[#1b2838] flex">
      {/* Sidebar izquierdo */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#171a21] border-r border-[#2a3f5f]">
        {/* User Info */}
        <div className="p-4 border-b border-[#2a3f5f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">SteamUser123</p>
              <p className="text-gray-400 text-xs">Wallet: $45.20</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <NavItem icon={<Store size={18} />} label="Store" />
          <NavItem icon={<Library size={18} />} label="Library" />
          <NavItem icon={<Users size={18} />} label="Community" active />
          <NavItem icon={<MessageSquare size={18} />} label="Chat" badge={2} />
        </nav>

        {/* Friends List */}
        <FriendsSidebar friends={friends} />
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
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left Sidebar - Your Groups & Recommended */}
              <div className="xl:col-span-1 space-y-6">
                <YourGroupsSidebar groups={yourGroups} />
                <RecommendedSection />
              </div>

              {/* Right Content - Featured & Groups Grid */}
              <div className="xl:col-span-3 space-y-6">
                {/* Featured Community Banner */}
                <FeaturedCommunityBanner community={featuredCommunity} />

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
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
                  {mockGroups.map((group) => (
                    <GroupCardExplorer key={group.id} group={group} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Button (fixed) */}
      <button className="fixed bottom-6 left-6 p-3 bg-[#2a3f5f] rounded-full text-gray-400 hover:text-white hover:bg-[#3a5070] transition-colors shadow-lg">
        <Settings size={20} />
      </button>
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ icon, label, active = false, badge = null }) => (
  <button
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
  </button>
);

export default CommunityExplorerPage;
