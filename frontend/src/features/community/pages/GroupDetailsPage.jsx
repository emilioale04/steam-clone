import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Settings, Megaphone, Shield, Plus, Gamepad2 } from 'lucide-react';
import { useGroupDetails } from '../hooks/useGroups';
import { useAnnouncements } from '../hooks/useCommunity';
import { forumService } from '../services/forumService';
import AnnouncementBanner from '../components/AnnouncementBanner';
import CreateForumModal from '../components/CreateForumModal';

export default function GroupDetailsPage() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('forums');
    const [forums, setForums] = useState([]);
    const [loadingForums, setLoadingForums] = useState(true);
    const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);
    const { 
        group, 
        members, 
        loading, 
        error, 
        fetchGroupDetails, 
        fetchMembers,
        updateGroup,
        updateMemberRole,
        toggleMemberBan
    } = useGroupDetails(groupId);
    const { announcements, fetchAnnouncements } = useAnnouncements(groupId);

    useEffect(() => {
        fetchGroupDetails();
        fetchMembers();
        fetchAnnouncements();
        loadForums();
    }, [fetchGroupDetails, fetchMembers, fetchAnnouncements]);

    const loadForums = async () => {
        try {
            setLoadingForums(true);
            const response = await forumService.getGroupForums(groupId);
            setForums(response.data || []);
        } catch (err) {
            console.error('Error loading forums:', err);
        } finally {
            setLoadingForums(false);
        }
    };

    const handleCreateForum = async (forumData) => {
        try {
            await forumService.createForum(groupId, forumData);
            await loadForums();
        } catch (err) {
            throw err;
        }
    };

    if (loading && !group) {
        return (
            <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Link
                        to="/community"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Volver a Comunidad
                    </Link>
                </div>
            </div>
        );
    }

    if (!group) return null;

    const userRole = group.user_membership?.rol;
    const isMember = group.user_membership !== null && group.user_membership?.estado_membresia === 'activo';
    const isOwner = userRole === 'Owner';
    const isModerator = userRole === 'Moderator' || isOwner;

    const getRoleBadge = (rol) => {
        const badges = {
            Owner: { text: 'Dueño', color: 'bg-purple-600 text-white' },
            Moderator: { text: 'Moderador', color: 'bg-blue-600 text-white' },
            Member: { text: 'Miembro', color: 'bg-gray-600 text-white' }
        };
        
        const badge = badges[rol] || badges.Member;
        
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

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
                            <Link to="/community" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                                <ArrowLeft size={18} />
                                <span className="hidden sm:inline">Volver a Grupos y Comunidad</span>
                                <span className="sm:hidden">Volver</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Group Header */}
            <div className="bg-gradient-to-r from-[#1b2838] to-[#2a475e] border-b border-[#2a475e]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        {group.avatar_url ? (
                            <img 
                                src={group.avatar_url} 
                                alt={group.nombre}
                                className="w-32 h-32 rounded object-cover border-2 border-[#2a475e]"
                            />
                        ) : (
                            <div className="w-32 h-32 bg-[#2a475e] rounded flex items-center justify-center border-2 border-[#3a576e]">
                                <Users className="text-gray-400" size={48} />
                            </div>
                        )}
                        
                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-white">{group.nombre}</h1>
                                {isMember && getRoleBadge(userRole)}
                            </div>
                            <p className="text-gray-300 mb-4">{group.descripcion}</p>
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span>{group.member_count} miembros</span>
                                </div>
                                <span>•</span>
                                <span className="capitalize">{group.visibilidad}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {!isMember && (
                                <button 
                                    onClick={() => {/* TODO: Implement join */}}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold"
                                >
                                    Unirse
                                </button>
                            )}
                            {isMember && !isOwner && (
                                <button 
                                    onClick={() => {/* TODO: Implement leave */}}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold"
                                >
                                    Abandonar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Announcements */}
                {announcements && announcements.length > 0 && (
                    <div className="mb-6">
                        {announcements.map((announcement) => (
                            <AnnouncementBanner key={announcement.id} announcement={announcement} />
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={() => setActiveTab('forums')}
                        className={`flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all ${
                            activeTab === 'forums'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e] hover:text-white'
                        }`}
                    >
                        <MessageSquare size={18} />
                        Foros
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all ${
                            activeTab === 'members'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e] hover:text-white'
                        }`}
                    >
                        <Users size={18} />
                        Miembros ({members.length})
                    </button>
                    {isModerator && (
                        <>
                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all ${
                                    activeTab === 'announcements'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e] hover:text-white'
                                }`}
                            >
                                <Megaphone size={18} />
                                Anuncios
                            </button>
                            <button
                                onClick={() => setActiveTab('moderation')}
                                className={`flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all ${
                                    activeTab === 'moderation'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e] hover:text-white'
                                }`}
                            >
                                <Shield size={18} />
                                Moderación
                            </button>
                        </>
                    )}
                    {isOwner && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all ${
                                activeTab === 'settings'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#2a475e] text-gray-300 hover:bg-[#3a576e] hover:text-white'
                            }`}
                        >
                            <Settings size={18} />
                            Configuración del Grupo
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === 'forums' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Foros de Discusión</h2>
                            {isOwner && (
                                <button
                                    onClick={() => setIsCreateForumModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold"
                                >
                                    <Plus size={18} />
                                    Nuevo Foro
                                </button>
                            )}
                        </div>

                        {loadingForums ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                            </div>
                        ) : forums.length === 0 ? (
                            <div className="bg-[#2a475e] rounded-lg p-12 text-center">
                                <MessageSquare className="mx-auto text-gray-500 mb-4" size={48} />
                                <h3 className="text-xl font-semibold text-white mb-2">No hay foros aún</h3>
                                <p className="text-gray-400">
                                    {isOwner ? 'Crea el primer foro para comenzar las discusiones' : 'El dueño del grupo aún no ha creado foros'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {forums.map((forum) => (
                                    <Link
                                        key={forum.id}
                                        to={`/community/groups/${groupId}/forum`}
                                        className="block bg-[#2a475e] hover:bg-[#3a576e] rounded-lg p-6 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                                                    {forum.titulo}
                                                </h3>
                                                {forum.descripcion && (
                                                    <p className="text-gray-400 mb-3">{forum.descripcion}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{forum.thread_count || 0} hilos</span>
                                                    <span>•</span>
                                                    <span>{forum.estado}</span>
                                                </div>
                                            </div>
                                            <MessageSquare className="text-gray-500 group-hover:text-blue-400 transition-colors" size={24} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Miembros del Grupo</h2>
                        <div className="bg-[#2a475e] rounded-lg overflow-hidden">
                            <div className="divide-y divide-[#1b2838]">
                                {members.map((member) => (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-[#3a576e] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#1b2838] rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {member.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    {member.profiles?.username || 'Usuario'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Miembro desde {new Date(member.fecha_union).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {getRoleBadge(member.rol)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'announcements' && isModerator && (
                    <div className="bg-[#2a475e] rounded-lg p-8 text-center">
                        <Megaphone className="mx-auto text-gray-500 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-white mb-2">Gestión de Anuncios</h3>
                        <p className="text-gray-400">
                            Aquí podrás crear y gestionar anuncios importantes del grupo.
                        </p>
                    </div>
                )}

                {activeTab === 'moderation' && isModerator && (
                    <div className="bg-[#2a475e] rounded-lg p-8 text-center">
                        <Shield className="mx-auto text-gray-500 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-white mb-2">Panel de Moderación</h3>
                        <p className="text-gray-400">
                            Aquí podrás gestionar reportes, solicitudes y configuración del grupo.
                        </p>
                    </div>
                )}

                {activeTab === 'settings' && isOwner && (
                    <div className="bg-[#2a475e] rounded-lg p-8 text-center">
                        <Settings className="mx-auto text-gray-500 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-white mb-2">Configuración del Grupo</h3>
                        <p className="text-gray-400">
                            Aquí podrás editar la información del grupo, permisos y otras configuraciones.
                        </p>
                    </div>
                )}
            </div>

            {/* Create Forum Modal */}
            <CreateForumModal
                isOpen={isCreateForumModalOpen}
                onClose={() => setIsCreateForumModalOpen(false)}
                onSubmit={handleCreateForum}
            />
        </div>
    );
}
