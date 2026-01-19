import { useState, useEffect } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import { 
  Search, 
  Users, 
  MessageSquare, 
  Calendar,
  ThumbsUp,
  Eye,
  ChevronDown,
  Plus,
  UserPlus,
  Play,
  Clock,
  Star,
  Shield,
  ExternalLink
} from 'lucide-react';

// ============================================
// MOCK DATA - Se usa cuando el backend falla
// ============================================
const generateMockData = (groupId) => ({
  id: groupId,
  nombre: `Grupo Simulado (${groupId})`,
  abreviatura: groupId.substring(0, 3).toUpperCase(),
  descripcion: `Competitive FPS community since 2015 • Public Group. Este es un grupo de demostración mientras el backend está en desarrollo.`,
  avatar_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=200&h=200&fit=crop',
  banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
  visibilidad: 'public',
  tipo: 'OFFICIAL GROUP',
  member_count: 12405,
  online_count: 1240,
  in_game_count: 856,
  founded: 'Oct 12, 2015',
  user_membership: null, // No es miembro en mock
  administrators: [
    { id: 1, username: 'Commander', avatar_url: null },
    { id: 2, username: 'TacticalLead', avatar_url: null },
    { id: 3, username: 'SquadMaster', avatar_url: null },
    { id: 4, username: 'ProGamer', avatar_url: null },
  ],
  related_groups: [
    { id: 'fps-enthusiasts', name: 'FPS Enthusiasts', member_count: '45k', icon: '🎯' },
    { id: 'strategy-hub', name: 'Strategy Hub', member_count: '12k', icon: '🎮' },
  ],
  pinned_announcement: {
    id: 1,
    titulo: 'Winter Championship 2024: Registration Open!',
    contenido: 'Commanders: The annual Winter Championship is finally here. We are accepting team registrations starting today until the end of the month. The prize pool has been increased to include exclusive in-game skins and community badges. Don\'t miss out on the action.',
    imagen_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    fecha_creacion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 245,
    comments: 42
  },
  community_media: [
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1493711662062-fa541f7f57b9?w=300&h=200&fit=crop',
  ],
  recent_activity: [
    {
      id: 1,
      type: 'discussion',
      user: { username: 'SniperWolf', avatar_url: null },
      action: 'created a new discussion',
      title: 'Best loadout for the new desert map?',
      preview: 'I\'ve been trying out the heavy assault rifle but the recoil feels different after the patch. Anyone found a meta build yet?',
      timestamp: '45m ago',
      replies: 18,
      views: 342
    },
    {
      id: 2,
      type: 'event',
      user: { username: 'GhostRider', avatar_url: null },
      action: 'scheduled an event',
      title: 'Weekend Scrims - Team A vs Team B',
      event_date: 'NOV 24',
      event_time: '20:00 EST • Private Server 3',
      timestamp: '2h ago'
    },
    {
      id: 3,
      type: 'comment',
      user: { username: 'MedicMain', avatar_url: null },
      action: 'commented on',
      reference: 'Update v2.5 Patch Notes',
      preview: '"Finally they fixed the healing drone bug! This changes everything for support players."',
      timestamp: '3h ago'
    }
  ]
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const GroupHomePage = () => {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityFilter, setActivityFilter] = useState('all');

  // Cargar datos del grupo (real o mock)
  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3000/api/community/groups/${groupId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Datos reales del grupo cargados:', result);
        setGroupData(result.data || result);
        setIsUsingMockData(false);
        
      } catch (err) {
        console.warn('⚠️ Error al cargar datos reales, usando mock:', err.message);
        // Fallback a datos mock
        const mockData = generateMockData(groupId);
        setGroupData(mockData);
        setIsUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Grupo no encontrado</h2>
          <Link to="/community" className="text-cyan-400 hover:underline">
            Volver a Comunidad
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'events', label: 'Events' },
    { id: 'members', label: 'Members' }
  ];

  const formatTimeAgo = (date) => {
    if (typeof date === 'string' && date.includes('ago')) return date;
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Mock Data Warning Banner */}
      {isUsingMockData && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/50 px-4 py-2">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ Mostrando datos de demostración. El backend no está disponible.
          </p>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-[#171a21] border-b border-[#2a3f5f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6">
              <Link to="/community" className="flex items-center gap-2 text-white font-semibold">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                  <Users size={14} />
                </div>
                <span>Community</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-4">
                <NavLink to="/community" end className={({ isActive }) => 
                  isActive ? 'text-white text-sm' : 'text-gray-400 text-sm hover:text-white'
                }>Home</NavLink>
                <NavLink to="/community/discussions" className="text-gray-400 text-sm hover:text-white">Discussions</NavLink>
                <NavLink to="/workshop" className="text-gray-400 text-sm hover:text-white">Workshop</NavLink>
                <NavLink to="/market" className="text-gray-400 text-sm hover:text-white">Market</NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="pl-9 pr-4 py-1.5 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48"
                />
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner + Group Info */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 md:h-64 overflow-hidden relative">
          <img 
            src={groupData.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop'}
            alt="Group Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b2838] via-transparent to-transparent"></div>
          
          {/* Official Badge */}
          {(groupData.tipo === 'OFFICIAL GROUP' || groupData.visibilidad === 'public') && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-[#2a3f5f]/80 backdrop-blur text-cyan-400 text-xs font-semibold rounded">
              {groupData.tipo || 'OFFICIAL GROUP'}
            </div>
          )}
        </div>

        {/* Group Header Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-20">
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg bg-[#171a21] border-4 border-[#1b2838] overflow-hidden flex-shrink-0">
              {groupData.avatar_url ? (
                <img src={groupData.avatar_url} alt={groupData.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Shield size={32} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {groupData.nombre}
              </h1>
              <p className="text-gray-400 text-sm mb-4">
                {groupData.descripcion}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2 md:mt-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors">
                <UserPlus size={16} />
                Invite Friends
              </button>
              <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded transition-colors">
                Join Group
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2a3f5f] mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              // El tab "Discussions" navega a su propia página
              if (tab.id === 'discussions') {
                return (
                  <Link
                    key={tab.id}
                    to={`/community/groups/${groupId}/discussions`}
                    className="px-4 py-3 text-sm font-medium transition-colors relative text-gray-400 hover:text-white"
                  >
                    {tab.label}
                  </Link>
                );
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">
            {/* Pinned Announcement */}
            {groupData.pinned_announcement && (
              <div className="bg-[#1e2837] rounded-lg overflow-hidden border border-[#2a3f5f]">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#2a3f5f]">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Star size={14} className="fill-current" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Pinned Announcement</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    Posted {formatTimeAgo(groupData.pinned_announcement.fecha_creacion)}
                  </span>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {groupData.pinned_announcement.titulo}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {groupData.pinned_announcement.contenido}
                  </p>
                  
                  {groupData.pinned_announcement.imagen_url && (
                    <div className="rounded-lg overflow-hidden mb-4">
                      <img 
                        src={groupData.pinned_announcement.imagen_url} 
                        alt="Announcement" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors">
                      <ThumbsUp size={14} />
                      Like ({groupData.pinned_announcement.likes})
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors">
                      <MessageSquare size={14} />
                      Comment ({groupData.pinned_announcement.comments})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Community Media */}
            {groupData.community_media && groupData.community_media.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold">Community Media</h2>
                  <button className="text-cyan-400 text-sm hover:underline">View All</button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {groupData.community_media.map((media, index) => (
                    <div key={index} className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={media} alt={`Media ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                    </div>
                  ))}
                  <div className="w-32 h-24 rounded-lg bg-[#2a3f5f] flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#3a5070] transition-colors">
                    <span className="text-gray-400 text-sm">+124 More</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Recent Activity</h2>
                <div className="flex items-center gap-2">
                  {['All', 'Discussions', 'Events'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter.toLowerCase())}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        activityFilter === filter.toLowerCase()
                          ? 'bg-[#2a3f5f] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {groupData.recent_activity?.map((activity) => (
                  <div key={activity.id} className="bg-[#1e2837] rounded-lg p-4 border border-[#2a3f5f]">
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {activity.user.username.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 font-medium text-sm">{activity.user.username}</span>
                          <span className="text-gray-500 text-sm">{activity.action}</span>
                          <span className="text-gray-500 text-xs ml-auto">{activity.timestamp}</span>
                        </div>

                        {activity.type === 'discussion' && (
                          <>
                            <h4 className="text-white font-medium mb-1">{activity.title}</h4>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{activity.preview}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MessageSquare size={12} />
                                {activity.replies} replies
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {activity.views} views
                              </span>
                            </div>
                          </>
                        )}

                        {activity.type === 'event' && (
                          <div className="flex items-center gap-3 bg-[#2a3f5f] rounded p-3 mt-2">
                            <div className="bg-red-600 text-white text-center px-3 py-2 rounded">
                              <div className="text-xs uppercase">{activity.event_date?.split(' ')[0]}</div>
                              <div className="text-xl font-bold">{activity.event_date?.split(' ')[1]}</div>
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{activity.title}</h4>
                              <p className="text-gray-400 text-sm">{activity.event_time}</p>
                            </div>
                          </div>
                        )}

                        {activity.type === 'comment' && (
                          <>
                            <span className="text-cyan-400 text-sm">{activity.reference}</span>
                            <p className="text-gray-400 text-sm italic mt-1">{activity.preview}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-3 bg-[#2a3f5f] hover:bg-[#3a5070] text-white text-sm rounded transition-colors">
                Load More Activity
              </button>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-72 space-y-4 flex-shrink-0">
            {/* Group Stats */}
            <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a3f5f] flex items-center gap-2">
                <Shield size={16} className="text-cyan-400" />
                <span className="text-white font-semibold text-sm">Group Stats</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Members</span>
                  <span className="text-white font-medium">{groupData.member_count?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online Now
                  </span>
                  <span className="text-white font-medium">{groupData.online_count?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                    In-Game
                  </span>
                  <span className="text-white font-medium">{groupData.in_game_count?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Founded</span>
                  <span className="text-white font-medium">{groupData.founded || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Link 
                to={`/community/groups/${groupId}/forum`}
                className="flex items-center gap-3 px-4 py-3 bg-[#1e2837] hover:bg-[#2a3f5f] border border-[#2a3f5f] rounded-lg transition-colors"
              >
                <MessageSquare size={18} className="text-cyan-400" />
                <span className="text-white text-sm">Group Forum</span>
              </Link>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-[#1e2837] hover:bg-[#2a3f5f] border border-[#2a3f5f] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Play size={18} className="text-cyan-400" />
                  <span className="text-white text-sm">Enter Chat Room</span>
                </div>
                <span className="text-cyan-400 text-xs font-medium">42 Online</span>
              </button>
            </div>

            {/* Administrators */}
            <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a3f5f] flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Administrators</span>
                <button className="text-cyan-400 text-xs hover:underline">View All</button>
              </div>
              <div className="p-4">
                <div className="flex -space-x-2">
                  {groupData.administrators?.slice(0, 4).map((admin, index) => (
                    <div 
                      key={admin.id} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-[#1e2837] flex items-center justify-center"
                      title={admin.username}
                    >
                      {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt={admin.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold">{admin.username.charAt(0)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Groups */}
            <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a3f5f]">
                <span className="text-white font-semibold text-sm">Related Groups</span>
              </div>
              <div className="divide-y divide-[#2a3f5f]">
                {groupData.related_groups?.map((relatedGroup) => (
                  <Link
                    key={relatedGroup.id}
                    to={`/community/groups/${relatedGroup.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#2a3f5f] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center text-lg">
                        {relatedGroup.icon || '🎮'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{relatedGroup.name}</p>
                        <p className="text-gray-500 text-xs">{relatedGroup.member_count} Members</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => e.preventDefault()}
                      className="w-6 h-6 rounded bg-[#2a3f5f] hover:bg-cyan-600 flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} className="text-white" />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHomePage;
