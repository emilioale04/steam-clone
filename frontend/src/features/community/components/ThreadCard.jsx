import { useState, useEffect } from 'react';
import { MessageSquare, Eye, Lock, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useGroupDetails } from '../hooks/useGroups';
import CommentBox from './CommentBox';
import ThreadActions from './ThreadActions';
import CommentActions from './CommentActions';
import { forumService } from '../services/forumService';

export default function ThreadCard({ thread, groupId, onThreadDeleted }) {
    const { user } = useAuth();
    const { group } = useGroupDetails(groupId);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [comments, setComments] = useState([]);
    const [displayedComments, setDisplayedComments] = useState(3);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});
    const COMMENTS_PER_PAGE = 5;

    const isMember = group?.user_membership !== null;
    const userRole = group?.user_membership?.rol;

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('es-ES');
        }
    };

    const loadComments = async () => {
        if (loading || comments.length > 0) return;
        
        setLoading(true);
        try {
            const response = await forumService.getThreadDetails(thread.id);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = async () => {
        if (!isExpanded) {
            await loadComments();
        }
        setIsExpanded(!isExpanded);
    };

    const handleComment = async (contenido, parentId = null) => {
        setSubmitting(true);
        try {
            await forumService.createComment(thread.id, contenido, parentId);
            // Recargar comentarios
            const response = await forumService.getThreadDetails(thread.id);
            setComments(response.data.comments || []);
            setShowCommentBox(false);
            setReplyingTo(null);
        } catch (error) {
            console.error('Error creating comment:', error);
            alert(error.message || 'Error al crear el comentario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleThreadStatus = async (close) => {
        try {
            await forumService.toggleThreadStatus(thread.id, close);
            window.location.reload(); // Refresh to show updated status
        } catch (err) {
            console.error('Error toggling thread status:', err);
        }
    };

    const handleDeleteThread = async () => {
        try {
            await forumService.deleteThread(thread.id);
            if (onThreadDeleted) {
                onThreadDeleted(thread.id);
            }
        } catch (err) {
            console.error('Error deleting thread:', err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await forumService.deleteComment(commentId);
            await loadComments(); // Refresh comments
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleEditComment = (comment) => {
        // Implementar lógica de edición si es necesario
        console.log('Edit comment:', comment);
    };

    // Organizar comentarios en estructura jerárquica
    const organizeComments = (allComments) => {
        const topLevelComments = allComments.filter(c => !c.id_comentario_padre);
        const commentMap = {};
        
        allComments.forEach(comment => {
            commentMap[comment.id] = { ...comment, replies: [] };
        });
        
        allComments.forEach(comment => {
            if (comment.id_comentario_padre && commentMap[comment.id_comentario_padre]) {
                commentMap[comment.id_comentario_padre].replies.push(commentMap[comment.id]);
            }
        });
        
        return topLevelComments.map(c => commentMap[c.id]);
    };

    const organizedComments = organizeComments(comments);
    const visibleComments = organizedComments.slice(0, displayedComments);
    const hasMoreComments = organizedComments.length > displayedComments;

    const CommentItem = ({ comment, depth = 0 }) => (
        <div className={`${depth > 0 ? 'ml-8 mt-2' : ''}`}>
            <div className="bg-[#1b2838] rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-blue-400 font-semibold">
                            {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                    {comment.profiles?.username || 'Usuario'}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    {formatDate(comment.fecha_publicacion)}
                                </span>
                                {comment.editado && (
                                    <span className="text-gray-500 text-xs italic">(editado)</span>
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
                        <p className="text-gray-300 whitespace-pre-wrap mb-2">
                            {comment.contenido}
                        </p>
                        <div className="flex items-center gap-3">
                            {thread.estado !== 'cerrado' && (
                                isMember ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                    >
                                        <CornerDownRight size={14} />
                                        Responder
                                    </button>
                                ) : (
                                    <div className="text-sm text-blue-400/70 flex items-center gap-1">
                                        <CornerDownRight size={14} />
                                        Únete a este grupo para responder
                                    </div>
                                )
                            )}
                            {comment.replies && comment.replies.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleReplies(comment.id);
                                    }}
                                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    {expandedReplies[comment.id] ? (
                                        <>
                                            <ChevronUp size={14} />
                                            Ocultar respuestas ({comment.replies.length})
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} />
                                            Ver respuestas ({comment.replies.length})
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply Box */}
            {isMember && replyingTo === comment.id && (
                <div className="ml-8 mt-2" onClick={(e) => e.stopPropagation()}>
                    <CommentBox
                        onSubmit={(contenido) => handleComment(contenido, comment.id)}
                        onCancel={() => setReplyingTo(null)}
                        submitLabel="Responder"
                        loading={submitting}
                    />
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-[#2a475e] rounded-lg p-6">
            {/* Thread Header - Clickeable para expandir/contraer */}
            <div 
                className="cursor-pointer"
                onClick={toggleExpand}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white hover:text-blue-400 transition-colors">
                                {thread.titulo}
                            </h3>
                            {thread.estado === 'cerrado' && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-900/30 text-red-400 flex items-center gap-1">
                                    <Lock size={12} />
                                    Cerrado
                                </span>
                            )}
                            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </div>
                        
                        <p className="text-gray-400 mb-3 line-clamp-2">
                            {thread.contenido}
                        </p>
                        
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                            <span className="text-gray-400">Por <span className="text-blue-400">{thread.profiles?.username || 'Usuario'}</span></span>
                            <span>•</span>
                            <span>{formatDate(thread.created_at)}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-gray-400">
                                <MessageSquare size={16} />
                                <span>{comments.length || thread.comment_count || 0} respuestas</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Eye size={16} />
                                <span>{thread.vistas || 0} vistas</span>
                            </div>
                        </div>
                    </div>
                    {user && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ThreadActions
                                thread={thread}
                                userRole={userRole}
                                userId={user.id}
                                groupId={groupId}
                                onToggleStatus={handleToggleThreadStatus}
                                onDelete={handleDeleteThread}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Button */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                {isMember ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowCommentBox(!showCommentBox);
                            if (!isExpanded) {
                                toggleExpand();
                            }
                        }}
                        className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2"
                        disabled={thread.estado === 'cerrado'}
                    >
                        <MessageSquare size={18} />
                        <span>{thread.estado === 'cerrado' ? 'Hilo cerrado' : 'Comentar'}</span>
                    </button>
                ) : (
                    <div className="text-blue-400 flex items-center gap-2">
                        <MessageSquare size={18} />
                        <span>Únete a este grupo para comentar</span>
                    </div>
                )}
            </div>

            {/* Comment Box */}
            {isMember && showCommentBox && thread.estado !== 'cerrado' && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <CommentBox
                        onSubmit={(contenido) => handleComment(contenido)}
                        submitLabel="Publicar"
                        loading={submitting}
                        onCancel={() => setShowCommentBox(false)}
                    />
                </div>
            )}

            {/* Comments Section */}
            {isExpanded && (
                <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    {loading && (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                    )}

                    {!loading && comments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            No hay respuestas aún. Sé el primero en comentar.
                        </p>
                    )}

                    {!loading && visibleComments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} depth={0} />
                    ))}

                    {hasMoreComments && (
                        <button
                            onClick={() => setDisplayedComments(prev => prev + COMMENTS_PER_PAGE)}
                            className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                        >
                            Mostrar más respuestas ({organizedComments.length - displayedComments} restantes)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
