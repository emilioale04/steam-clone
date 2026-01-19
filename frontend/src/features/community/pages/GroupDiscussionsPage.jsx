import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Plus,
  Pin,
  Users,
  Gamepad2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  AlertCircle,
  ExternalLink,
  Flag
} from 'lucide-react';

// ============================================================================
// MOCK DATA - Datos exactos del mockup como respaldo
// ============================================================================
const generateMockGroupData = (groupId) => ({
  id: groupId,
  nombre: 'Space Explorers Guild',
  descripcion: 'The premier community for deep space strategy, trading routes, and cosmic exploration enthusiasts.',
  abbreviation: 'SEG',
  avatar_url: null,
  is_official: true,
  established: '2021',
  members_count: 1240,
  in_game_count: 143,
  online_in_chat: 58
});

const generateMockThreads = (groupId) => [
  {
    id: 'thread-1',
    title: 'Welcome to Space Explorers! Read the Rules first.',
    author: 'Admin_Nova',
    author_avatar: null,
    created_at: '2023-10-02',
    is_pinned: true,
    is_announcement: true,
    replies_count: 0,
    views_count: 5200,
    last_post_date: 'Oct 02, 2023',
    last_post_author: 'Admin_Nova',
    last_post_author_avatar: null
  },
  {
    id: 'thread-2',
    title: 'Best trade routes for the new sector update?',
    author: 'StarTrader99',
    author_avatar: null,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_announcement: false,
    replies_count: 24,
    views_count: 342,
    last_post_date: '2 mins ago',
    last_post_author: 'CosmicRay',
    last_post_author_avatar: null
  },
  {
    id: 'thread-3',
    title: 'WARNING: Pirate activity in Sector 7 increased',
    author: 'FleetCommander',
    author_avatar: null,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_announcement: false,
    replies_count: 156,
    views_count: 1200,
    last_post_date: '10 mins ago',
    last_post_author: 'Rookie_Pilot',
    last_post_author_avatar: null
  },
  {
    id: 'thread-4',
    title: 'Looking for a Guild Officer to manage recruiting',
    author: 'GuildMaster',
    author_avatar: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_announcement: false,
    replies_count: 8,
    views_count: 89,
    last_post_date: '1 hour ago',
    last_post_author: 'Applicant_One',
    last_post_author_avatar: null
  },
  {
    id: 'thread-5',
    title: 'Screenshot contest results: "Nebula Dreams"',
    author: 'ArtMod',
    author_avatar: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_announcement: false,
    replies_count: 82,
    views_count: 900,
    last_post_date: 'Yesterday',
    last_post_author: 'Winner_Pix',
    last_post_author_avatar: null
  }
];

const generateMockOfficers = () => [
  {
    id: 'officer-1',
    username: 'Admin_Nova',
    avatar_url: null,
    status: 'playing',
    status_text: 'Playing Space Sim 2',
    role: 'Admin'
  },
  {
    id: 'officer-2',
    username: 'Mod_Star',
    avatar_url: null,
    status: 'online',
    status_text: 'Online',
    role: 'Moderator'
  }
];

const forumRules = [
  'Be respectful to other pilots.',
  'No trading in General Discussion.',
  'Use search before posting.'
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const Breadcrumbs = ({ groupName }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
    <Link to="/" className="hover:text-white transition-colors">Home</Link>
    <span>/</span>
    <Link to="/community" className="hover:text-white transition-colors">Groups</Link>
    <span>/</span>
    <Link to={`/community/groups/${encodeURIComponent(groupName?.toLowerCase().replace(/\s+/g, '-') || 'group')}`} className="hover:text-white transition-colors">
      {groupName}
    </Link>
    <span>/</span>
    <span className="text-cyan-400">Discussions</span>
  </nav>
);

const GroupHeader = ({ group }) => (
  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700/50">
    {/* Group Avatar */}
    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center overflow-hidden flex-shrink-0">
      {group.avatar_url ? (
        <img src={group.avatar_url} alt={group.nombre} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl font-bold text-white">
          {group.abbreviation || group.nombre?.charAt(0)}
        </span>
      )}
    </div>

    {/* Group Info */}
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-white mb-1">{group.nombre}</h1>
      <p className="text-gray-400 text-sm mb-2">{group.descripcion}</p>
      <div className="flex items-center gap-3">
        {group.is_official && (
          <span className="px-2 py-0.5 bg-cyan-600/30 text-cyan-400 text-xs font-semibold rounded border border-cyan-500/50">
            OFFICIAL GROUP
          </span>
        )}
        {group.established && (
          <span className="text-gray-500 text-xs">Est. {group.established}</span>
        )}
      </div>
    </div>
  </div>
);

const ForumToolbar = ({ sortBy, onSortChange, groupId }) => (
  <div className="flex items-center justify-between mb-4">
    {/* Sort Dropdown */}
    <div className="relative">
      <button className="flex items-center gap-2 px-4 py-2 bg-[#1b2838] border border-gray-700 rounded text-gray-300 hover:border-gray-600 transition-colors">
        <span className="text-sm">{sortBy}</span>
        <ChevronDown size={16} />
      </button>
    </div>

    {/* New Discussion Button */}
    <Link
      to={`/community/groups/${groupId}/discussions/new`}
      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors"
    >
      <Plus size={18} />
      <span>New Discussion</span>
    </Link>
  </div>
);

const ThreadRow = ({ thread, groupId, isPinned }) => {
  // Formatear número con K si es mayor a 1000
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toLocaleString();
  };

  return (
    <tr className={`group border-b border-gray-700/50 hover:bg-[#1e2a3a] transition-colors ${isPinned ? 'bg-[#1a2535]' : ''}`}>
      {/* Topic Column */}
      <td className={`py-4 px-4 ${isPinned ? 'border-l-2 border-cyan-500' : ''}`}>
        <div className="flex items-start gap-3">
          {isPinned && (
            <Pin size={16} className="text-cyan-400 mt-1 flex-shrink-0 rotate-45" />
          )}
          <div>
            <Link 
              to={`/community/groups/${groupId}/discussions/${thread.id}`}
              className="text-white font-medium hover:text-cyan-400 transition-colors block"
            >
              {thread.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">
                Started by <span className="text-gray-400">{thread.author}</span>
              </span>
              {thread.is_announcement && (
                <span className="px-2 py-0.5 bg-cyan-600/30 text-cyan-400 text-xs rounded">
                  ANNOUNCEMENT
                </span>
              )}
              {!thread.is_pinned && (
                <span className="text-gray-600 text-xs">
                  · {formatTimeAgo(thread.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Replies Column */}
      <td className="py-4 px-4 text-center">
        <span className="text-gray-300">{thread.replies_count}</span>
      </td>

      {/* Views Column */}
      <td className="py-4 px-4 text-center">
        <span className="text-gray-300">{formatNumber(thread.views_count)}</span>
      </td>

      {/* Last Post Column */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 justify-end">
          <div className="text-right">
            <span className="text-gray-400 text-sm block">{thread.last_post_date}</span>
            <span className="text-cyan-400 text-sm">{thread.last_post_author}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden">
            {thread.last_post_author_avatar ? (
              <img 
                src={thread.last_post_author_avatar} 
                alt={thread.last_post_author}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-white font-medium">
                {thread.last_post_author?.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Actions Column */}
      <td className="py-4 px-2">
        <Link
          to={`/community/report/${thread.id}?type=thread&author=${encodeURIComponent(thread.author)}&group=${encodeURIComponent(groupId)}`}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Report this thread"
        >
          <Flag size={14} />
        </Link>
      </td>
    </tr>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (currentPage > 3 && currentPage < totalPages - 2) {
        pages.push('...');
        pages.push(currentPage);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-gray-400 text-sm">
        Showing 1-5 of 124 threads
      </span>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

const ForumSearch = ({ searchQuery, onSearchChange }) => (
  <div className="bg-[#1b2838] rounded-lg p-4 mb-4">
    <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
      Forum Search
    </h3>
    <div className="relative">
      <input
        type="text"
        placeholder="Keywords..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-[#171a21] border border-gray-700 rounded px-3 py-2 pr-10 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-cyan-600 hover:bg-cyan-500 rounded transition-colors">
        <Search size={16} className="text-white" />
      </button>
    </div>
  </div>
);

const GroupStats = ({ group }) => (
  <div className="bg-[#1b2838] rounded-lg p-4 mb-4">
    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
      <Users size={18} className="text-cyan-400" />
      Group Stats
    </h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Members</span>
        <span className="text-white font-medium">{group.members_count?.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400">In-Game</span>
        <span className="text-green-400 font-medium flex items-center gap-1">
          <Gamepad2 size={14} />
          {group.in_game_count}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Online in Chat</span>
        <span className="text-white font-medium">{group.online_in_chat}</span>
      </div>
    </div>
  </div>
);

const OnlineOfficers = ({ officers }) => (
  <div className="bg-[#1b2838] rounded-lg p-4 mb-4">
    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
      <Circle size={10} className="text-cyan-400 fill-cyan-400" />
      Online Officers
    </h3>
    <div className="space-y-3">
      {officers.map((officer) => (
        <div key={officer.id} className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden">
              {officer.avatar_url ? (
                <img src={officer.avatar_url} alt={officer.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-white font-medium">{officer.username?.charAt(0)}</span>
              )}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1b2838] ${
              officer.status === 'playing' ? 'bg-green-500' : 'bg-cyan-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cyan-400 font-medium text-sm truncate">{officer.username}</p>
            <p className="text-gray-500 text-xs truncate">
              {officer.status === 'playing' ? officer.status_text : 'Online'}
            </p>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full mt-4 py-2 border border-gray-600 rounded text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm">
      View All Members
    </button>
  </div>
);

const ForumRules = ({ rules }) => (
  <div className="bg-[#1b2838] rounded-lg p-4">
    <h3 className="text-white font-semibold mb-4">Forum Rules</h3>
    <ul className="space-y-2 mb-4">
      {rules.map((rule, index) => (
        <li key={index} className="flex items-start gap-2 text-gray-400 text-sm">
          <span className="text-cyan-400 mt-1">•</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
    <Link 
      to="#"
      className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-colors"
    >
      Read Full Guidelines
      <ExternalLink size={14} />
    </Link>
  </div>
);

// Función auxiliar para formatear tiempo relativo
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const GroupDiscussionsPage = () => {
  const { groupId } = useParams();

  // Estados
  const [group, setGroup] = useState(null);
  const [threads, setThreads] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [error, setError] = useState(null);

  // Estados de UI
  const [sortBy, setSortBy] = useState('Most Recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  // ========================================================================
  // CARGA DE DATOS (Híbrida: Real → Mock)
  // ========================================================================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Intentar cargar datos reales del grupo
        const groupResponse = await fetch(
          `http://localhost:3000/api/community/groups/${groupId}`,
          { credentials: 'include' }
        );

        if (!groupResponse.ok) {
          throw new Error('Error al cargar datos del grupo');
        }

        const groupData = await groupResponse.json();
        setGroup(groupData.data || groupData);

        // Intentar cargar hilos del foro
        const threadsResponse = await fetch(
          `http://localhost:3000/api/community/groups/${groupId}/discussions`,
          { credentials: 'include' }
        );

        if (threadsResponse.ok) {
          const threadsData = await threadsResponse.json();
          setThreads(threadsData.data || threadsData);
        } else {
          // Si los hilos fallan, usar mock pero mantener grupo real
          setThreads(generateMockThreads(groupId));
        }

        // Cargar oficiales online
        const officersResponse = await fetch(
          `http://localhost:3000/api/community/groups/${groupId}/officers`,
          { credentials: 'include' }
        );

        if (officersResponse.ok) {
          const officersData = await officersResponse.json();
          setOfficers(officersData.data || officersData);
        } else {
          setOfficers(generateMockOfficers());
        }

        setIsUsingMockData(false);
        console.log('✅ Datos reales cargados para discusiones del grupo');

      } catch (err) {
        console.warn('⚠️ Usando datos mock para discusiones:', err.message);
        
        // Fallback completo a mock data
        setGroup(generateMockGroupData(groupId));
        setThreads(generateMockThreads(groupId));
        setOfficers(generateMockOfficers());
        setIsUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando discusiones...</p>
        </div>
      </div>
    );
  }

  if (error && !isUsingMockData) {
    return (
      <div className="min-h-screen bg-[#171a21] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171a21]">
      {/* Mock Data Banner */}
      {isUsingMockData && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/50 px-4 py-2">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ Modo Demo: Mostrando datos de ejemplo (API no disponible)
          </p>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs groupName={group?.nombre} />

        {/* Group Header */}
        <GroupHeader group={group} />

        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0">
            {/* Section Title */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">General Discussion</h2>
              <p className="text-gray-400 text-sm">
                Talk about anything related to the guild or the game universe.
              </p>
            </div>

            {/* Toolbar */}
            <ForumToolbar 
              sortBy={sortBy} 
              onSortChange={setSortBy}
              groupId={groupId}
            />

            {/* Discussions Table */}
            <div className="bg-[#1b2838] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-4 font-medium">Topic</th>
                    <th className="text-center py-3 px-4 font-medium w-24">Replies</th>
                    <th className="text-center py-3 px-4 font-medium w-24">Views</th>
                    <th className="text-right py-3 px-4 font-medium w-40">Last Post</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((thread) => (
                    <ThreadRow 
                      key={thread.id} 
                      thread={thread} 
                      groupId={groupId}
                      isPinned={thread.is_pinned}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Right Column - Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <ForumSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <GroupStats group={group} />
            <OnlineOfficers officers={officers} />
            <ForumRules rules={forumRules} />
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            © 2023 SteamClone Corp. · <Link to="#" className="hover:text-gray-400">Privacy</Link> · <Link to="#" className="hover:text-gray-400">Terms</Link>
          </p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              <Gamepad2 size={20} />
            </Link>
            <Link to="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              <MessageCircle size={20} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GroupDiscussionsPage;
