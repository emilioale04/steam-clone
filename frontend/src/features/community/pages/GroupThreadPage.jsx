import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Search,
  Clock,
  Eye,
  MessageSquare,
  Bell,
  Reply,
  ThumbsUp,
  ThumbsDown,
  Quote,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  Image,
  Smile,
  AlertCircle,
  Flag
} from 'lucide-react';

// ============================================================================
// MOCK DATA - Datos exactos del mockup como respaldo
// ============================================================================
const generateMockThreadData = (threadId) => ({
  id: threadId,
  title: 'Best strategies for the upcoming raid event?',
  created_at: '2 hours ago',
  views_count: 1200,
  replies_count: 42,
  tags: [
    { id: 'tag-1', name: 'STRATEGY', color: 'cyan', isPrimary: true },
    { id: 'tag-2', name: 'PvE', color: 'gray' },
    { id: 'tag-3', name: 'Raid Guide', color: 'gray' }
  ],
  group: {
    id: 'raiders-guild',
    name: 'Raiders Guild',
    forum_name: 'General Discussion'
  }
});

const generateMockPosts = () => [
  {
    id: 'post-1',
    author: {
      username: 'RaidLeader_X',
      avatar_url: null,
      level: 50,
      class: 'Warlock',
      badges: ['crown', 'star', 'trophy'], // OP badge + otros
      is_op: true
    },
    created_at: 'October 24, 2023 @ 10:42 AM',
    content: `Hey everyone, with the new Abyssal Raid event dropping next Tuesday, I wanted to open a discussion on the best team compositions and loadouts.

From what we've seen in the teaser trailer, the boss seems to have a high resistance to Fire damage but is vulnerable to Void. I'm thinking a heavy Void-warlock setup might be the meta, but I'm worried about the add-clear phase.`,
    quote: {
      text: '"Preparation is half the battle. The other half is violence."'
    },
    additional_content: `Does anyone know if the **Chronos Rifle** buff from the last patch will stack with the Bard's song? If so, that changes everything.`,
    helpful_count: 24,
    is_helpful_by_user: false
  },
  {
    id: 'post-2',
    author: {
      username: 'SupportMain_99',
      avatar_url: null,
      level: 32,
      class: 'Cleric',
      badges: [],
      is_op: false
    },
    reply_to: {
      number: 1,
      time_ago: '1 hour ago'
    },
    created_at: null,
    content: `I tested the stacking on the PTR server last night.

Unfortunately, the **@Chronos Rifle** buff is now considered a "Global Aura" so it overrides the Bard song instead of adding to it. You're better off running a pure DPS relic in that slot.`,
    code_block: {
      title: '// Calculation',
      lines: [
        'Total_DPS = (Base * 1.5) + Relic_Bonus',
        '// Bard Song is ignored if Relic is active :('
      ]
    },
    likes: 12,
    dislikes: 0
  },
  {
    id: 'post-3',
    author: {
      username: 'Tank_Commander',
      avatar_url: null,
      level: 99,
      class: 'Paladin',
      badges: ['moderator'],
      is_op: false
    },
    reply_to: {
      number: 2,
      time_ago: '45 mins ago'
    },
    created_at: null,
    content: `Confirmed. Also, don't forget that the boss enrages at 20% HP. If we don't save our cooldowns for that burn phase, we wipe.

I'll be updating the **Official Raid Guide** pinned in the header later tonight with these findings.`,
    likes: 8,
    dislikes: 0
  }
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const Breadcrumbs = ({ group }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
    <Link to="/community" className="hover:text-white transition-colors">Groups</Link>
    <span>/</span>
    <Link to={`/community/groups/${group?.id}`} className="hover:text-white transition-colors">
      {group?.name}
    </Link>
    <span>/</span>
    <span className="text-cyan-400">{group?.forum_name}</span>
  </nav>
);

const ThreadHeader = ({ thread, onPostReply }) => (
  <div className="mb-6">
    <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
      {thread.title}
    </h1>
    
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
      <span className="flex items-center gap-1">
        <Clock size={14} />
        {thread.created_at}
      </span>
      <span className="flex items-center gap-1">
        <Eye size={14} />
        {thread.views_count?.toLocaleString()} views
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={14} />
        {thread.replies_count} replies
      </span>
    </div>

    <div className="flex items-center justify-between">
      {/* Tags */}
      <div className="flex items-center gap-2">
        {thread.tags?.map((tag) => (
          <span
            key={tag.id}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              tag.isPrimary
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-700/50 text-gray-300 border border-gray-600'
            }`}
          >
            {tag.isPrimary && '★ '}
            {tag.name}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPostReply}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors"
        >
          <Reply size={16} />
          Post Reply
        </button>
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </div>
  </div>
);

const SortTabs = ({ activeSort, onSortChange }) => {
  const sorts = ['Oldest', 'Newest', 'Most Helpful'];
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex bg-[#1b2838] rounded overflow-hidden">
        {sorts.map((sort) => (
          <button
            key={sort}
            onClick={() => onSortChange(sort)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSort === sort
                ? 'bg-[#2a3f5f] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {sort}
          </button>
        ))}
      </div>
      <span className="text-gray-400 text-sm">Page 1 of 3</span>
    </div>
  );
};

const AuthorBadge = ({ type }) => {
  const badges = {
    crown: { icon: '👑', color: 'yellow' },
    star: { icon: '⭐', color: 'yellow' },
    trophy: { icon: '🏆', color: 'yellow' },
    moderator: { text: 'MODERATOR', color: 'cyan' }
  };
  
  const badge = badges[type];
  if (!badge) return null;
  
  if (badge.text) {
    return (
      <span className="px-2 py-0.5 bg-cyan-600/30 text-cyan-400 text-xs font-semibold rounded">
        {badge.text}
      </span>
    );
  }
  
  return <span className="text-sm">{badge.icon}</span>;
};

const PostCard = ({ post, isFirst, groupId }) => {
  const [showActions, setShowActions] = useState(false);

  // Renderizar contenido con markdown básico (bold)
  const renderContent = (text) => {
    if (!text) return null;
    
    // Convertir **text** a bold y @mentions a cyan
    const parts = text.split(/(\*\*[^*]+\*\*|@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="text-cyan-400 font-medium">
            {part.slice(2, -2)}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-cyan-400">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden mb-4">
      <div className="flex">
        {/* Left Column - Author Info */}
        <div className="w-36 md:w-44 bg-[#1a2535] p-4 flex flex-col items-center text-center border-r border-[#2a3f5f]">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden">
              {post.author.avatar_url ? (
                <img 
                  src={post.author.avatar_url} 
                  alt={post.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-white font-bold">
                  {post.author.username?.charAt(0)}
                </span>
              )}
            </div>
            {post.author.is_op && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">OP</span>
              </div>
            )}
          </div>

          {/* Username */}
          <p className="text-cyan-400 font-semibold text-sm mb-1">
            {post.author.username}
          </p>
          
          {/* Level & Class */}
          <p className="text-gray-500 text-xs mb-2">
            Level {post.author.level} • {post.author.class}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-1">
            {post.author.badges?.map((badge, index) => (
              <AuthorBadge key={index} type={badge} />
            ))}
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="flex-1 p-4">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500 text-sm">
              {post.reply_to ? (
                <span>
                  Reply #{post.reply_to.number} • {post.reply_to.time_ago}
                </span>
              ) : (
                <span>Posted {post.created_at}</span>
              )}
            </div>
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="text-gray-300 space-y-4">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{renderContent(paragraph)}</p>
            ))}

            {/* Quote Block */}
            {post.quote && (
              <blockquote className="border-l-4 border-cyan-500 bg-cyan-900/20 px-4 py-3 my-4 italic text-gray-400">
                {post.quote.text}
              </blockquote>
            )}

            {/* Additional Content */}
            {post.additional_content && (
              <p>{renderContent(post.additional_content)}</p>
            )}

            {/* Code Block */}
            {post.code_block && (
              <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm my-4 border border-gray-700">
                <p className="text-green-400 mb-2">{post.code_block.title}</p>
                {post.code_block.lines.map((line, index) => (
                  <p key={index} className={line.startsWith('//') ? 'text-gray-500' : 'text-cyan-400'}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Post Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
            {/* Helpful / Votes */}
            {post.helpful_count !== undefined ? (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded transition-colors">
                <ThumbsUp size={14} />
                <span className="text-sm font-medium">HELPFUL ({post.helpful_count})</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                  <ThumbsUp size={16} />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                  <ThumbsDown size={16} />
                  <span className="text-sm">{post.dislikes}</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                <Quote size={14} />
                Quote
              </button>
              <button className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                <Reply size={14} />
                Reply
              </button>
              <Link 
                to={`/community/report/${post.id}?type=post&author=${encodeURIComponent(post.author?.username || 'Unknown')}&group=${encodeURIComponent(groupId || 'group')}`}
                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors text-sm"
              >
                <Flag size={14} />
                Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-center gap-1 my-6">
    <button 
      onClick={() => onPageChange(1)}
      disabled={currentPage === 1}
      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronsLeft size={18} />
    </button>
    <button 
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronLeft size={18} />
    </button>
    
    {[1, 2, 3].map((page) => (
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
    ))}
    
    <span className="px-2 text-gray-500">...</span>
    
    <button
      onClick={() => onPageChange(12)}
      className="w-8 h-8 rounded text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
    >
      12
    </button>
    
    <button 
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronRight size={18} />
    </button>
    <button 
      onClick={() => onPageChange(totalPages)}
      disabled={currentPage === totalPages}
      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronsRight size={18} />
    </button>
  </div>
);

const ReplyEditor = ({ currentUser, onSubmit }) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSubmit(replyContent);
    setReplyContent('');
    setIsSubmitting(false);
  };

  const formatButtons = [
    { icon: Bold, label: 'Bold' },
    { icon: Italic, label: 'Italic' },
    { icon: LinkIcon, label: 'Link' },
    { icon: Code, label: 'Code' },
    { icon: Image, label: 'Image' },
    { icon: Smile, label: 'Emoji' }
  ];

  return (
    <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2a3f5f] bg-[#1a2535]">
        <span className="text-gray-500 text-xs uppercase tracking-wider mr-4">Formatting</span>
        {formatButtons.map((btn, index) => (
          <button
            key={index}
            title={btn.label}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors"
          >
            <btn.icon size={16} />
          </button>
        ))}
      </div>

      {/* Text Area */}
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write a reply..."
        rows={5}
        className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none"
      />

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a3f5f] bg-[#1a2535]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {currentUser?.username?.charAt(0) || 'G'}
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            Posting as <span className="text-white">{currentUser?.username || 'Guest_User'}</span>
          </span>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!replyContent.trim() || isSubmitting}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post Reply'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const GroupThreadPage = () => {
  const { groupId, threadId } = useParams();

  // Estados
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [error, setError] = useState(null);

  // Estados de UI
  const [activeSort, setActiveSort] = useState('Oldest');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  // Usuario actual (simulado)
  const currentUser = { username: 'Guest_User' };

  // ========================================================================
  // CARGA DE DATOS (Híbrida: Real → Mock)
  // ========================================================================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Intentar cargar datos reales del hilo
        const threadResponse = await fetch(
          `http://localhost:3000/api/community/groups/${groupId}/discussions/${threadId}`,
          { credentials: 'include' }
        );

        if (!threadResponse.ok) {
          throw new Error('Error al cargar datos del hilo');
        }

        const threadData = await threadResponse.json();
        setThread(threadData.data || threadData);

        // Intentar cargar posts del hilo
        const postsResponse = await fetch(
          `http://localhost:3000/api/community/groups/${groupId}/discussions/${threadId}/posts`,
          { credentials: 'include' }
        );

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData.data || postsData);
        } else {
          setPosts(generateMockPosts());
        }

        setIsUsingMockData(false);
        console.log('✅ Datos reales cargados para el hilo');

      } catch (err) {
        console.warn('⚠️ Usando datos mock para el hilo:', err.message);
        
        // Fallback completo a mock data
        setThread(generateMockThreadData(threadId));
        setPosts(generateMockPosts());
        setIsUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId && threadId) {
      fetchData();
    }
  }, [groupId, threadId]);

  // Handler para nueva respuesta
  const handlePostReply = (content) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: {
        username: currentUser.username,
        avatar_url: null,
        level: 1,
        class: 'Newbie',
        badges: [],
        is_op: false
      },
      reply_to: {
        number: posts.length + 1,
        time_ago: 'Just now'
      },
      content: content,
      likes: 0,
      dislikes: 0
    };
    
    setPosts([...posts, newPost]);
  };

  // Scroll al editor
  const scrollToEditor = () => {
    document.getElementById('reply-editor')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando hilo...</p>
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

      {/* Top Navigation */}
      <header className="bg-[#1b2838] border-b border-[#2a3f5f]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/community" className="text-white font-semibold flex items-center gap-2">
                <MessageSquare size={18} className="text-cyan-400" />
                Groups & Communities
              </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <Link to={`/community/groups/${groupId}/discussions`} className="text-gray-400 hover:text-white transition-colors">
                  Discussions
                </Link>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  Workshop
                </Link>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  Market
                </Link>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  Broadcasts
                </Link>
              </nav>
            </div>
            
            {/* Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search discussions"
                className="w-48 lg:w-64 bg-[#171a21] border border-gray-700 rounded px-3 py-1.5 pl-9 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs group={thread?.group} />

        {/* Thread Header */}
        <ThreadHeader thread={thread} onPostReply={scrollToEditor} />

        {/* Sort Tabs */}
        <SortTabs activeSort={activeSort} onSortChange={setActiveSort} />

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} isFirst={index === 0} groupId={groupId} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Reply Editor */}
        <div id="reply-editor">
          <ReplyEditor 
            currentUser={currentUser}
            onSubmit={handlePostReply}
          />
        </div>
      </main>
    </div>
  );
};

export default GroupThreadPage;
