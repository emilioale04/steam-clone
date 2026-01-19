import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThread } from '../hooks/useForum';
import { useAuth } from '../../auth/hooks/useAuth';
import { useGroupDetails } from '../hooks/useGroups';
import { forumService } from '../services/forumService';
import CommentBox from '../components/CommentBox';
import ThreadActions from '../components/ThreadActions';
import CommentActions from '../components/CommentActions';

export default function ThreadDetailsPage() {
    const { groupId, threadId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { group } = useGroupDetails(groupId);
    const { thread, loading, error, fetchThread, createComment, deleteComment } = useThread(threadId);
    const [, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);

    useEffect(() => {
        fetchThread();
    }, [fetchThread]);

    const handleCreateComment = async (contenido) => {
        await createComment(contenido);
        setReplyingTo(null);
    };

    const handleToggleThreadStatus = async (close) => {
        try {
            await forumService.toggleThreadStatus(threadId, close);
            await fetchThread();
        } catch (err) {
            console.error('Error toggling thread status:', err);
        }
    };

    const handleDeleteThread = async () => {
        try {
            await forumService.deleteThread(threadId);
            navigate(`/community/groups/${groupId}/forum`);
        } catch (err) {
            console.error('Error deleting thread:', err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteComment(commentId);
            await fetchThread();
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment);
        // Aquí podrías implementar la lógica de edición
    };


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !thread) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => navigate(`/community/groups/${groupId}/forum`)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Volver al foro
                    </button>
                </div>
            </div>
        );
    }

    if (!thread) return null;

    const isClosed = thread.estado === 'cerrado';
    const isMember = group?.user_membership !== null;
    const userRole = group?.user_membership?.rol;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate(`/community/groups/${groupId}/forum`)}
                        className="text-blue-600 hover:text-blue-700 mb-2 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al foro
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-bold text-gray-900">{thread.titulo}</h1>
                            {isClosed && (
                                <span className="px-3 py-1 text-sm font-semibold rounded bg-gray-100 text-gray-600">
                                    Cerrado
                                </span>
                            )}
                        </div>
                        {user && (
                            <ThreadActions
                                thread={thread}
                                userRole={userRole}
                                userId={user.id}
                                groupId={groupId}
                                onToggleStatus={handleToggleThreadStatus}
                                onDelete={handleDeleteThread}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Thread Content */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-start space-x-4">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-lg">
                                    {thread.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <p className="font-semibold text-gray-900">
                                    {thread.profiles?.username || 'Usuario'}
                                </p>
                                <span className="text-gray-500">•</span>
                                <p className="text-sm text-gray-500">{formatDate(thread.created_at)}</p>
                            </div>
                            <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                                {thread.contenido}
                            </div>
                            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>{thread.vistas || 0} vistas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Respuestas ({thread.comments?.length || 0})
                    </h2>

                    {thread.comments && thread.comments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg shadow p-6">
                            {comment.eliminado ? (
                                <p className="text-gray-500 italic">Este comentario ha sido eliminado</p>
                            ) : (
                                <div className="flex items-start space-x-4">
                                    <div className="shrink-0">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 font-semibold">
                                                {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <p className="font-semibold text-gray-900">
                                                    {comment.profiles?.username || 'Usuario'}
                                                </p>
                                                <span className="text-gray-500">•</span>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(comment.fecha_publicacion)}
                                                </p>
                                                {comment.editado && (
                                                    <>
                                                        <span className="text-gray-500">•</span>
                                                        <p className="text-xs text-gray-400 italic">Editado</p>
                                                    </>
                                                )}
                                            </div>
                                            {user && (
                                                <CommentActions
                                                    comment={comment}
                                                    userRole={userRole}
                                                    userId={user.id}
                                                    groupId={groupId}
                                                    onEdit={() => handleEditComment(comment)}
                                                    onDelete={() => handleDeleteComment(comment.id)}
                                                />
                                            )}
                                        </div>
                                        <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                                            {comment.contenido}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* New Comment */}
                    {!isClosed && isMember && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Responder</h3>
                            <CommentBox
                                onSubmit={handleCreateComment}
                                submitLabel="Publicar Respuesta"
                            />
                        </div>
                    )}
                    
                    {!isClosed && !isMember && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-blue-800 font-semibold">
                                Únete a este grupo para comentar
                            </p>
                        </div>
                    )}

                    {isClosed && (
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                            Este hilo está cerrado y no acepta nuevas respuestas
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
