import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { useForum } from '../hooks/useForum';
import { useGroupDetails } from '../hooks/useGroups';
import ThreadCard from '../components/ThreadCard';
import CreateThreadModal from '../components/CreateThreadModal';

export default function ForumPage() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { threads, forum, loading, error, fetchForum, fetchThreads, createThread } = useForum(groupId);
    const { group } = useGroupDetails(groupId);
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const [creatingThreadLoading, setCreatingThreadLoading] = useState(false);

    const isMember = group?.user_membership !== null;

    useEffect(() => {
        fetchForum();
        fetchThreads();
    }, [fetchForum, fetchThreads]);

    const handleCreateThread = async (threadData) => {
        setCreatingThreadLoading(true);
        try {
            await createThread(threadData);
        } finally {
            setCreatingThreadLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1b2838]">
            {/* Header */}
            <div className="bg-[#171a21] shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <button
                                onClick={() => navigate(`/community/groups/${groupId}`)}
                                className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Volver al grupo
                            </button>
                            <div className="flex items-center gap-3 mb-1">
                                <MessageSquare className="text-blue-400" size={32} />
                                <h1 className="text-3xl font-bold text-white">
                                    Foro del Grupo
                                </h1>
                            </div>
                            {forum && (
                                <h2 className="text-xl text-gray-300 mb-1">
                                    {forum.titulo}
                                </h2>
                            )}
                            <p className="text-gray-400">
                                Participa en las discusiones y comparte tus ideas
                            </p>
                        </div>
                        {isMember ? (
                            <button
                                onClick={() => setIsCreatingThread(true)}
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
                            >
                                <Plus size={20} />
                                Nuevo Hilo
                            </button>
                        ) : (
                            <div className="px-6 py-3 bg-blue-600/20 text-blue-400 rounded-lg flex items-center gap-2 font-semibold border border-blue-500/30">
                                <Plus size={20} />
                                Únete a este grupo para publicar un hilo
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    </div>
                )}

                {!loading && threads.length === 0 && (
                    <div className="bg-[#2a475e] rounded-lg p-12 text-center">
                        <MessageSquare className="mx-auto text-gray-500 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-white mb-2">No hay hilos aún</h3>
                        <p className="text-gray-400">
                            Sé el primero en iniciar una discusión en este foro
                        </p>
                    </div>
                )}

                {!loading && threads.length > 0 && (
                    <div className="space-y-3">
                        {threads.map((thread) => (
                            <ThreadCard key={thread.id} thread={thread} groupId={groupId} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para crear hilo */}
            <CreateThreadModal
                isOpen={isCreatingThread}
                onClose={() => setIsCreatingThread(false)}
                onSubmit={handleCreateThread}
                loading={creatingThreadLoading}
            />
        </div>
    );
}
