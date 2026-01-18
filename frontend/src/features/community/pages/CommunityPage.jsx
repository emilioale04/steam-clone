import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Search, Gamepad2 } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';

export const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('my-groups'); // 'my-groups' o 'discover'
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { groups, loading, error, fetchMyGroups, searchGroups, createGroup } = useGroups();

  useEffect(() => {
    if (activeTab === 'my-groups') {
      fetchMyGroups();
    } else {
      searchGroups('');
    }
  }, [activeTab, fetchMyGroups, searchGroups]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (activeTab === 'discover') {
      await searchGroups(searchTerm);
    }
  };

  const handleCreateGroup = async (groupData) => {
    await createGroup(groupData);
    setIsCreateModalOpen(false);
    setActiveTab('my-groups');
    await fetchMyGroups();
  };

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="bg-linear-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Gamepad2 className="text-white" size={24} />
                </div>
                <span className="text-white text-xl font-bold hidden sm:block">Steam Clone</span>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={18} />
                Volver al Inicio
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
              <Users className="text-blue-400" size={32} />
              Comunidad
            </h1>
            <p className="text-gray-400 mt-1">
              Únete a grupos, participa en discusiones y conecta con otros jugadores
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Grupo
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#2a475e]">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'my-groups'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Users size={20} />
            Mis Grupos
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'discover'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Search size={20} />
            Descubrir
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'discover' && (
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar grupos..."
                  className="w-full bg-[#316282] text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold"
              >
                Buscar
              </button>
            </div>
          </form>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        )}

        {/* Groups Grid */}
        {!loading && (
          <>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">
                  {activeTab === 'my-groups' ? 'No eres miembro de ningún grupo' : 'No se encontraron grupos'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {activeTab === 'my-groups' 
                    ? 'Únete o crea un grupo para comenzar' 
                    : 'Intenta con otros términos de búsqueda'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => {
                  // Extraer datos del grupo según estructura
                  const groupData = group.grupos || group;
                  return (
                    <GroupCard key={groupData.id} group={groupData} />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
};
