import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Settings, Megaphone, Shield, Plus, Gamepad2, Pin, PinOff, ChevronDown, ChevronUp, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useGroupDetails, useGroups } from '../hooks/useGroups';
import { useAnnouncements } from '../hooks/useCommunity';
import { useAuth } from '../../auth/hooks/useAuth';
import { forumService } from '../services/forumService';
import AnnouncementBanner from '../components/AnnouncementBanner';
import CreateForumModal from '../components/CreateForumModal';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import GroupSettingsForm from '../components/GroupSettingsForm';
import ForumActions from '../components/ForumActions';
import InviteMemberModal from '../components/InviteMemberModal';

export default function GroupDetailsPage() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('forums');
    const [forums, setForums] = useState([]);
    const [loadingForums, setLoadingForums] = useState(true);
    const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);
    const [isCreateAnnouncementModalOpen, setIsCreateAnnouncementModalOpen] = useState(false);
    const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
    const [joiningGroup, setJoiningGroup] = useState(false);
    const [leavingGroup, setLeavingGroup] = useState(false);
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [rulesText, setRulesText] = useState('');
    const [searchMember, setSearchMember] = useState('');
    const [isOwnerSectionExpanded, setIsOwnerSectionExpanded] = useState(true);
    const [isModeratorsExpanded, setIsModeratorsExpanded] = useState(true);
    const [isMembersExpanded, setIsMembersExpanded] = useState(true);
    const [isAspirantesExpanded, setIsAspirantesExpanded] = useState(true);
    const { 
        group, 
        members, 
        pendingRequests,
        loading, 
        error, 
        fetchGroupDetails, 
        fetchMembers,
        fetchPendingRequests,
        updateGroup,
        updateMemberRole,
        toggleMemberBan,
        handleJoinRequest,
        deleteGroup
    } = useGroupDetails(groupId);
    const { joinGroup, leaveGroup } = useGroups();
    const { announcements, loading: loadingAnnouncements, createAnnouncement, updateAnnouncement, fetchAnnouncements } = useAnnouncements(groupId);

    useEffect(() => {
        const loadData = async () => {
            await fetchGroupDetails();
            // Intentar cargar datos adicionales, pero no bloquear si hay errores de acceso
            fetchMembers().catch((err) => console.log('No se pudieron cargar miembros:', err.message));
            fetchPendingRequests().catch((err) => console.log('No se pudieron cargar solicitudes:', err.message));
            fetchAnnouncements().catch((err) => console.log('No se pudieron cargar anuncios:', err.message));
            loadForums();
        };
        loadData();
    }, [fetchGroupDetails, fetchMembers, fetchPendingRequests, fetchAnnouncements]);

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

    const handleSaveGroupSettings = async (updateData) => {
        try {
            await updateGroup(updateData);
            // Refrescar los detalles del grupo después de guardar
            await fetchGroupDetails();
        } catch (err) {
            throw err;
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await deleteGroup();
            // Redirigir a la página de comunidad después de eliminar
            navigate('/community');
        } catch (err) {
            throw err;
        }
    };

    const handleToggleForumStatus = async (forumId, close) => {
        try {
            await forumService.toggleForumStatus(forumId, close);
            await loadForums();
        } catch (err) {
            console.error('Error toggling forum status:', err);
            throw err;
        }
    };

    const handleDeleteForum = async (forumId) => {
        try {
            await forumService.deleteForum(forumId);
            await loadForums();
        } catch (err) {
            console.error('Error deleting forum:', err);
            throw err;
        }
    };

    const handleJoinGroup = async () => {
        if (joiningGroup) return;
        
        try {
            setJoiningGroup(true);
            const response = await joinGroup(groupId);
            
            // Mostrar mensaje de éxito
            if (response.status === 'joined') {
                alert('Te has unido al grupo exitosamente');
                // Solo refrescar si realmente se unió al grupo
                await fetchGroupDetails();
                await fetchMembers().catch(() => {});
            } else if (response.status === 'requested' || response.status === 'pending') {
                alert(response.message || 'Solicitud enviada. Espera la aprobación de los moderadores');
                // Solo refrescar detalles del grupo para actualizar has_pending_request
                await fetchGroupDetails();
            }
        } catch (err) {
            console.error('Error joining group:', err);
            // Mostrar el mensaje de error específico del backend
            alert(err.message || 'Error al unirse al grupo. Por favor, intenta de nuevo.');
        } finally {
            setJoiningGroup(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (leavingGroup) return;
        
        // Confirmación antes de abandonar el grupo
        if (!window.confirm('¿Estás seguro de que quieres abandonar este grupo?')) {
            return;
        }

        try {
            setLeavingGroup(true);
            await leaveGroup(groupId);
            alert('Has abandonado el grupo exitosamente');
            // Redirigir a la página de grupos después de abandonar
            navigate('/community');
        } catch (err) {
            console.error('Error leaving group:', err);
            // Mostrar el mensaje de error específico del backend
            alert(err.message || 'Error al abandonar el grupo. Por favor, intenta de nuevo.');
            setLeavingGroup(false);
        }
    };

    const handleCreateAnnouncement = async (announcementData) => {
        try {
            await createAnnouncement(announcementData);
            setIsCreateAnnouncementModalOpen(false);
        } catch (err) {
            throw err;
        }
    };

    const handleTogglePinAnnouncement = async (announcementId, currentPinned) => {
        try {
            await updateAnnouncement(announcementId, { fijado: !currentPinned });
            // El hook ya refresca automáticamente la lista después del update
        } catch (err) {
            console.error('Error toggling pin:', err);
            alert(err.message || 'Error al fijar/desfijar el anuncio');
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateMemberRole(memberId, newRole);
            // fetchMembers se llama automáticamente en updateMemberRole
        } catch (err) {
            console.error('Error changing role:', err);
            alert(err.message || 'Error al cambiar el rol');
        }
    };

    const handleInviteMember = async (targetUserId) => {
        try {
            const { groupService } = await import('../services/groupService');
            await groupService.inviteUser(groupId, targetUserId);
            alert('Invitación enviada exitosamente');
            setIsInviteMemberModalOpen(false);
        } catch (err) {
            console.error('Error inviting member:', err);
            alert(err.message || 'Error al enviar la invitación');
        }
    };

    if (loading && !group) {
        return (
            <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    // Si hay error pero no hay grupo, mostrar error completo
    if (error && !group) {
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
    const hasPendingRequest = group.has_pending_request === true;
    const isOwner = userRole === 'Owner';
    const isModerator = userRole === 'Moderator' || isOwner;

    // Obtener anuncio fijado (el backend ya filtra los expirados)
    const pinnedAnnouncement = announcements.find(a => a.fijado);

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
                            {!isMember && user && !hasPendingRequest && (
                                <button 
                                    onClick={handleJoinGroup}
                                    disabled={joiningGroup}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {joiningGroup ? 'Enviando solicitud...' : (group.visibilidad === 'Restricted' ? 'Solicitar Unirse' : 'Unirse')}
                                </button>
                            )}
                            {!isMember && user && hasPendingRequest && (
                                <button 
                                    disabled
                                    className="px-6 py-2 bg-yellow-600 text-white rounded transition-colors font-semibold cursor-not-allowed opacity-75"
                                >
                                    Solicitud Pendiente
                                </button>
                            )}
                            {isMember && !isOwner && (
                                <button 
                                    onClick={handleLeaveGroup}
                                    disabled={leavingGroup}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {leavingGroup ? 'Abandonando...' : 'Abandonar'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Anuncio Fijado */}
                {pinnedAnnouncement && (
                    <div className="mb-6">
                        <AnnouncementBanner announcement={pinnedAnnouncement} />
                    </div>
                )}

                {/* Mensaje informativo si no es miembro */}
                {!isMember && user && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 border border-orange-700/50 rounded-lg p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Shield className="text-orange-400" size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {hasPendingRequest ? 'Solicitud Pendiente' : (group.visibilidad === 'Restricted' ? 'Grupo Restringido' : 'Grupo Cerrado')}
                                </h3>
                                <p className="text-gray-300 mb-3">
                                    {hasPendingRequest 
                                        ? 'Tu solicitud para unirte a este grupo está pendiente de aprobación por los moderadores. Te notificaremos cuando sea revisada.'
                                        : (group.visibilidad === 'Restricted' 
                                            ? 'Este es un grupo restringido. Debes enviar una solicitud y ser aprobado por los moderadores para acceder al contenido completo.'
                                            : 'Este es un grupo cerrado. Solo puedes unirte mediante invitación de los moderadores.')}
                                </p>
                                {!hasPendingRequest && (
                                    <button 
                                        onClick={handleJoinGroup}
                                        disabled={joiningGroup}
                                        className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <UserPlus size={18} />
                                        {joiningGroup ? 'Enviando solicitud...' : (group.visibilidad === 'Restricted' ? 'Enviar Solicitud de Ingreso' : 'Solicitar Invitación')}
                                    </button>
                                )}
                                {hasPendingRequest && (
                                    <div className="flex items-center gap-2 px-6 py-2 bg-yellow-600/50 text-yellow-100 rounded font-semibold">
                                        <UserPlus size={18} />
                                        Solicitud en Revisión
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs - Solo visible para miembros */}
                {isMember && (
                <>
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
                            {isMember && isOwner && (
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
                                    <div
                                        key={forum.id}
                                        className="bg-[#2a475e] hover:bg-[#3a576e] rounded-lg p-6 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <Link
                                                to={`/community/groups/${groupId}/forum`}
                                                className="flex-1"
                                            >
                                                <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
                                                    {forum.titulo}
                                                </h3>
                                                {forum.descripcion && (
                                                    <p className="text-gray-400 mb-3">{forum.descripcion}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{forum.thread_count || 0} hilos</span>
                                                    <span>•</span>
                                                    <span className={forum.estado === 'cerrado' ? 'text-red-400' : ''}>
                                                        {forum.estado}
                                                    </span>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="text-gray-500 group-hover:text-blue-400 transition-colors" size={24} />
                                                {isMember && (
                                                    <ForumActions
                                                        forum={forum}
                                                        userRole={userRole}
                                                        groupId={groupId}
                                                        onToggleStatus={(close) => handleToggleForumStatus(forum.id, close)}
                                                        onDelete={() => handleDeleteForum(forum.id)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Miembros del Grupo</h2>
                            <div className="flex items-center gap-3">
                                {isMember && (
                                    <button
                                        onClick={() => setIsInviteMemberModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-semibold"
                                    >
                                        <UserPlus size={18} />
                                        Invitar Miembros
                                    </button>
                                )}
                                <input
                                    type="text"
                                    placeholder="Buscar miembros"
                                    value={searchMember}
                                    onChange={(e) => setSearchMember(e.target.value)}
                                    className="w-64 px-4 py-2 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                        
                        {/* Dueño - Solo visible para moderadores y dueños */}
                        {isModerator && members.filter(m => m.rol === 'Owner' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).length > 0 && (
                            <div>
                                <button
                                    onClick={() => setIsOwnerSectionExpanded(!isOwnerSectionExpanded)}
                                    className="w-full text-lg font-semibold text-white mb-3 flex items-center justify-between hover:text-blue-400 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="text-yellow-400" size={20} />
                                        Dueño
                                    </div>
                                    {isOwnerSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isOwnerSectionExpanded && (
                                <div className="bg-[#2a475e] rounded-lg overflow-hidden">
                                    <div className="divide-y divide-[#1b2838]">
                                        {members.filter(m => m.rol === 'Owner' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).map((member) => (
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
                                                <div className="flex items-center gap-3">
                                                    {getRoleBadge(member.rol)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Moderadores - Solo visible para moderadores y dueños */}
                        {isModerator && members.filter(m => m.rol === 'Moderator' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).length > 0 && (
                            <div>
                                <button
                                    onClick={() => setIsModeratorsExpanded(!isModeratorsExpanded)}
                                    className="w-full text-lg font-semibold text-white mb-3 flex items-center justify-between hover:text-blue-400 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="text-blue-400" size={20} />
                                        Moderadores ({members.filter(m => m.rol === 'Moderator' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).length})
                                    </div>
                                    {isModeratorsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isModeratorsExpanded && (
                                <div className="bg-[#2a475e] rounded-lg overflow-hidden">
                                    <div className="divide-y divide-[#1b2838]">
                                        {members.filter(m => m.rol === 'Moderator' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).map((member) => (
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
                                                <div className="flex items-center gap-3">
                                                    {isOwner ? (
                                                        <select
                                                            value={member.rol}
                                                            onChange={(e) => handleRoleChange(member.profiles?.id, e.target.value)}
                                                            className="px-3 py-1 text-sm font-semibold rounded bg-[#1b2838] text-white border border-gray-600 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                                                        >
                                                            <option value="Moderator">Moderador</option>
                                                            <option value="Member">Miembro</option>
                                                        </select>
                                                    ) : (
                                                        getRoleBadge(member.rol)
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Miembros - Visible para todos */}
                        {members.filter(m => m.rol === 'Member' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).length > 0 && (
                            <div>
                                <button
                                    onClick={() => setIsMembersExpanded(!isMembersExpanded)}
                                    className="w-full text-lg font-semibold text-white mb-3 flex items-center justify-between hover:text-blue-400 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="text-gray-400" size={20} />
                                        Miembros ({members.filter(m => m.rol === 'Member' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).length})
                                    </div>
                                    {isMembersExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isMembersExpanded && (
                                <div className="bg-[#2a475e] rounded-lg overflow-hidden">
                                    <div className="divide-y divide-[#1b2838]">
                                        {members.filter(m => m.rol === 'Member' && (!searchMember || m.profiles?.username?.toLowerCase().includes(searchMember.toLowerCase()))).map((member) => (
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
                                                <div className="flex items-center gap-3">
                                                    {isOwner ? (
                                                        <select
                                                            value={member.rol}
                                                            onChange={(e) => handleRoleChange(member.profiles?.id, e.target.value)}
                                                            className="px-3 py-1 text-sm font-semibold rounded bg-[#1b2838] text-white border border-gray-600 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                                                        >
                                                            <option value="Member">Miembro</option>
                                                            <option value="Moderator">Moderador</option>
                                                        </select>
                                                    ) : (
                                                        getRoleBadge(member.rol)
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Aspirantes - Solo visible para todos los miembros en grupos Restricted */}
                        {isMember && group.visibilidad === 'Restricted' && pendingRequests && pendingRequests.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setIsAspirantesExpanded(!isAspirantesExpanded)}
                                    className="w-full text-lg font-semibold text-white mb-3 flex items-center justify-between hover:text-blue-400 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="text-orange-400" size={20} />
                                        Aspirantes ({pendingRequests.length})
                                    </div>
                                    {isAspirantesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isAspirantesExpanded && (
                                <div className="bg-[#2a475e] rounded-lg overflow-hidden">
                                    <div className="p-4 border-b border-[#1b2838]">
                                        <p className="text-gray-400 text-sm">Lista de perfiles que desean unirse al grupo</p>
                                    </div>
                                    <div className="divide-y divide-[#1b2838]">
                                        {pendingRequests.map((request) => (
                                            <div key={request.id} className="p-4 flex items-center justify-between hover:bg-[#3a576e] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-[#1b2838] rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-lg">
                                                            {request.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">
                                                            {request.profiles?.username || 'Usuario'}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            Solicitud enviada el {new Date(request.fecha_solicitud).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isModerator && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleJoinRequest(request.id, true)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold flex items-center gap-1"
                                                            title="Aprobar solicitud"
                                                        >
                                                            <CheckCircle size={16} />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleJoinRequest(request.id, false)}
                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold flex items-center gap-1"
                                                            title="Rechazar solicitud"
                                                        >
                                                            <XCircle size={16} />
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'announcements' && isModerator && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Anuncios del Grupo</h2>
                            <button
                                onClick={() => setIsCreateAnnouncementModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold"
                            >
                                <Plus size={18} />
                                Nuevo Anuncio
                            </button>
                        </div>

                        {loadingAnnouncements ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="bg-[#2a475e] rounded-lg p-12 text-center">
                                <Megaphone className="mx-auto text-gray-500 mb-4" size={48} />
                                <h3 className="text-xl font-semibold text-white mb-2">No hay anuncios aún</h3>
                                <p className="text-gray-400">
                                    Crea el primer anuncio para mantener informados a los miembros del grupo
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-[#2a475e] rounded-lg p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <Megaphone className="text-blue-400" size={24} />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-xl font-bold text-white">
                                                                {announcement.titulo}
                                                            </h3>
                                                            {announcement.fijado && (
                                                                <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-semibold rounded flex items-center gap-1">
                                                                    <Pin size={12} />
                                                                    Fijado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                                                            <span className="font-semibold text-blue-400">
                                                                {announcement.profiles?.username || 'Usuario'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                Expira: {new Date(announcement.fecha_expiracion).toLocaleString('es-ES', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTogglePinAnnouncement(announcement.id, announcement.fijado)}
                                                        className={`px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1 ${
                                                            announcement.fijado
                                                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                                                : 'bg-[#3a576e] hover:bg-[#4a677e] text-gray-300'
                                                        }`}
                                                        title={announcement.fijado ? 'Desfijar' : 'Fijar en la parte superior'}
                                                    >
                                                        {announcement.fijado ? (
                                                            <>
                                                                <PinOff size={14} />
                                                                Desfijar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Pin size={14} />
                                                                Fijar
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-gray-300 whitespace-pre-wrap">
                                                    {announcement.contenido}
                                                </p>
                                                <div className="mt-3 text-xs text-gray-500">
                                                    Publicado el {new Date(announcement.fecha_publicacion).toLocaleDateString('es-ES')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rules' && isMember && (
                    <div className="bg-[#2a475e] rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Shield className="text-blue-400" size={28} />
                            Reglas del Grupo
                        </h2>
                        {group.reglas ? (
                            <div className="bg-[#1b2838] rounded-lg p-6">
                                <p className="text-gray-300 whitespace-pre-wrap text-lg leading-relaxed">{group.reglas}</p>
                            </div>
                        ) : (
                            <div className="bg-[#1b2838] rounded-lg p-8 text-center">
                                <Shield className="mx-auto text-gray-500 mb-4" size={48} />
                                <p className="text-gray-400 text-lg">
                                    Este grupo aún no ha establecido reglas.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'moderation' && isModerator && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Panel de Moderación</h2>
                        
                        {/* Reglas del Grupo - Todos los moderadores ven, solo el Owner edita */}
                        <div className="bg-[#2a475e] rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield className="text-blue-400" size={24} />
                                Reglas del Grupo
                            </h3>
                            <div className="space-y-4">
                                {isEditingRules && isOwner ? (
                                    <>
                                        <textarea
                                            value={rulesText}
                                            onChange={(e) => setRulesText(e.target.value)}
                                            placeholder="Escribe las reglas del grupo aquí..."
                                            className="w-full h-64 bg-[#1b2838] text-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await updateGroup({ reglas: rulesText });
                                                        alert('Reglas actualizadas correctamente');
                                                        await fetchGroupDetails();
                                                        setIsEditingRules(false);
                                                    } catch (err) {
                                                        alert(err.message || 'Error al actualizar las reglas');
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-semibold"
                                            >
                                                Guardar Reglas
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingRules(false);
                                                    setRulesText(group.reglas || '');
                                                }}
                                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors font-semibold"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {group.reglas ? (
                                            <div className="bg-[#1b2838] rounded-lg p-4">
                                                <p className="text-gray-300 whitespace-pre-wrap">{group.reglas}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-center py-4">
                                                No hay reglas establecidas para este grupo
                                            </p>
                                        )}
                                        {isOwner && (
                                            <button
                                                onClick={() => {
                                                    setRulesText(group.reglas || '');
                                                    setIsEditingRules(true);
                                                }}
                                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-semibold"
                                            >
                                                {group.reglas ? 'Editar Reglas' : 'Establecer Reglas'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && isOwner && (
                    <div className="bg-[#2a475e] rounded-lg p-8">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Settings size={28} />
                            Configuración del Grupo
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Edita el nombre, descripción, avatar y visibilidad de tu grupo.
                        </p>
                        <GroupSettingsForm
                            group={group}
                            onSave={handleSaveGroupSettings}
                            onCancel={() => setActiveTab('forums')}
                            onDelete={handleDeleteGroup}
                            isOwner={isOwner}
                        />
                    </div>
                )}
                </>
                )}

                {/* Mensaje para no miembros */}
                {!isMember && user && (
                    <div className="text-center py-12">
                        <Users className="mx-auto text-gray-500 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Necesitas ser miembro para ver el contenido
                        </h3>
                        <p className="text-gray-400">
                            {group.visibilidad === 'Restricted' 
                                ? 'Envía una solicitud para unirte a este grupo y acceder a todos los foros, anuncios y miembros.'
                                : 'Este grupo es privado. Contacta a un moderador para obtener una invitación.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Create Forum Modal - Solo renderizar si es miembro */}
            {isMember && (
            <CreateForumModal
                isOpen={isCreateForumModalOpen}
                onClose={() => setIsCreateForumModalOpen(false)}
                onSubmit={handleCreateForum}
            />
            )}

            {/* Create Announcement Modal - Solo renderizar si es moderador */}
            {isModerator && (
            <CreateAnnouncementModal
                isOpen={isCreateAnnouncementModalOpen}
                onClose={() => setIsCreateAnnouncementModalOpen(false)}
                onSubmit={handleCreateAnnouncement}
                loading={loadingAnnouncements}
            />
            )}

            {/* Invite Member Modal */}
            {isMember && (
            <InviteMemberModal
                isOpen={isInviteMemberModalOpen}
                onClose={() => setIsInviteMemberModalOpen(false)}
                onInvite={handleInviteMember}
            />
            )}
        </div>
    );
}
