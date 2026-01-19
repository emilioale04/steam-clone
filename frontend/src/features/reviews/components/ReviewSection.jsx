import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { ReviewModerator } from './ReviewModerator';
import { useAuth, ROLES } from '../../auth';
import { reviewValidator } from '../../../shared/utils/validators';

export const ReviewSection = ({ gameId }) => {
    const { user, hasRole } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [newReview, setNewReview] = useState('');
    const [isRecommended, setIsRecommended] = useState(true);
    const [error, setError] = useState('');

    // Initial demo data
    const DEMO_REVIEWS = [
        { id: 1, gameId: '1', userId: 'gamer1', user: ' Gamer123', content: '¡Cyberpunk ahora sí es una obra maestra!', recommended: true, date: '2024-01-15' },
        { id: 2, gameId: '1', userId: 'hater1', user: 'Hater_007', content: 'Aún tiene bugs menores pero es jugable.', recommended: true, date: '2024-02-01' },
        { id: 3, gameId: '2', userId: 'hater1', user: 'EldenFan', content: 'GOTY indiscutible. La dificultad es perfecta.', recommended: true, date: '2024-02-05' },
        { id: 4, gameId: '3', userId: 'gamer1', user: 'FarmerJoe', content: 'Muy relajante, pierdo la noción del tiempo.', recommended: true, date: '2024-01-20' },
    ];

    useEffect(() => {
        // Simulate API fetch for reviews
        setReviewsLoading(true);
        const timer = setTimeout(() => {
            const filtered = DEMO_REVIEWS.filter(r => r.gameId === String(gameId));
            setReviews(filtered);
            setReviewsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [gameId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!newReview.trim()) {
            setError('La reseña no puede estar vacía');
            return;
        }

        if (!reviewValidator.test(newReview)) {
            setError(reviewValidator.message);
            return;
        }

        const sanitizedContent = reviewValidator.clean(newReview);

        const review = {
            id: Date.now(),
            gameId: String(gameId),
            userId: user?.id || 'temp-id',
            user: user?.username || 'Anónimo',
            content: sanitizedContent,
            recommended: isRecommended,
            date: new Date().toISOString().split('T')[0],
        };

        setReviews([review, ...reviews]);
        setNewReview('');
    };

    // State for editing
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const handleDelete = (id) => {
        // Allow if Moderator OR if Owner
        const review = reviews.find(r => r.id === id);
        const isOwner = user && review && review.userId === user.id;

        // Moderator check is handled inside ReviewModerator for that specific component, 
        // but for the "Own Delete" button we check ownership.

        if (isOwner) {
            if (window.confirm('¿Estás seguro de que quieres eliminar tu reseña?')) {
                setReviews(reviews.filter(r => r.id !== id));
            }
        } else {
            // Fallback for Moderator action passed from ReviewModerator
            if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña? (Acción de Moderador)')) {
                setReviews(reviews.filter(r => r.id !== id));
            }
        }
    };

    const startEditing = (review) => {
        setEditingId(review.id);
        setEditContent(review.content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
    };

    const saveEdit = (id) => {
        if (!editContent.trim()) return;

        if (!reviewValidator.test(editContent)) {
            alert(reviewValidator.message);
            return;
        }

        const sanitizedContent = reviewValidator.clean(editContent);

        setReviews(reviews.map(r =>
            r.id === id ? { ...r, content: sanitizedContent } : r
        ));
        setEditingId(null);
        setEditContent('');
    };

    const isLimited = user?.role === ROLES.LIMITED;

    return (
        <div className="bg-[#1b2838] p-6 rounded-lg text-[#c6d4df] font-sans">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <MessageSquare size={24} />
                Reseñas de Jugadores
            </h3>

            {/* Write Review Form - HIDDEN FOR LIMITED USERS */}
            {user && !isLimited ? (
                <form onSubmit={handleSubmit} className="mb-8 bg-[#00000033] p-4 rounded border border-[#2a475e]">
                    <h4 className="text-lg font-medium text-[#66c0f4] mb-2">Escribe una Reseña</h4>
                    <textarea
                        value={newReview}
                        onChange={(e) => {
                            setNewReview(e.target.value);
                            if (error) setError('');
                        }}
                        className={`w-full bg-[#2a3f5a] text-white p-3 rounded border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-none'} focus:ring-1 focus:ring-[#66c0f4] outline-none min-h-[100px]`}
                        placeholder="¿Qué te pareció este juego?"
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsRecommended(true)}
                                className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${isRecommended ? 'bg-[#66c0f4] text-[#1b2838]' : 'bg-[#2a3f5a] hover:bg-[#3c506e]'}`}
                            >
                                <ThumbsUp size={16} /> Me gustó
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsRecommended(false)}
                                className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${!isRecommended ? 'bg-[#66c0f4] text-[#1b2838]' : 'bg-[#2a3f5a] hover:bg-[#3c506e]'}`}
                            >
                                <ThumbsDown size={16} /> No me gustó
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded flex items-center gap-2 font-bold"
                        >
                            <Send size={16} /> Publicar Reseña
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-4 bg-[#2a475e] text-center rounded">
                    {isLimited ? (
                        <span className="text-red-400">Tu cuenta es Limitada. No puedes publicar reseñas.</span>
                    ) : (
                        "Por favor inicia sesión para escribir una reseña."
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviewsLoading ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#66c0f4]"></div>
                        <p className="text-[#8091a2] animate-pulse">Cargando reseñas...</p>
                    </div>
                ) : (
                    <>
                        {reviews.map((review) => {
                            const isOwner = user && review.userId === user.id;

                            return (
                                <div key={review.id} className="bg-[#16202d] p-4 rounded border-l-4 border-l-[#16202d] hover:border-l-[#66c0f4] transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded ${review.recommended ? 'bg-[#1b2838] text-[#66c0f4]' : 'bg-[#1b2838] text-red-500'}`}>
                                                {review.recommended ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-base text-[#c1dbf4]">{review.user}</div>
                                                <div className="text-xs text-[#8091a2]">{review.date}</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons for Owner */}
                                        {isOwner && !isLimited && !editingId && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEditing(review)}
                                                    className="text-[#8091a2] hover:text-white p-1"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="text-[#8091a2] hover:text-red-400 p-1"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit Mode vs View Mode */}
                                    {editingId === review.id ? (
                                        <div className="mt-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-[#2a3f5a] text-white p-2 rounded border border-[#66c0f4] outline-none min-h-[80px]"
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={cancelEditing}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white flex items-center gap-1"
                                                >
                                                    <X size={14} /> Cancelar
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(review.id)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white flex items-center gap-1"
                                                >
                                                    <Check size={14} /> Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-[#acb2b8] leading-relaxed break-words whitespace-pre-wrap">
                                            {review.content}
                                        </div>
                                    )}

                                    <ReviewModerator reviewId={review.id} onDelete={handleDelete} />
                                </div>
                            )
                        })}
                        {reviews.length === 0 && (
                            <p className="text-[#8091a2] italic text-center py-4">Aún no hay reseñas para este juego.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

ReviewSection.propTypes = {
    gameId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
