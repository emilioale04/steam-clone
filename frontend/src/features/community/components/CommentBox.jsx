import { useState } from 'react';

export default function CommentBox({ onSubmit, onCancel, initialValue = '', submitLabel = 'Publicar', loading = false }) {
    const [content, setContent] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!content.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDisabled = isSubmitting || loading;

    return (
        <form onSubmit={handleSubmit} className="bg-[#1b2838] rounded-lg p-4">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full px-3 py-2 bg-[#2a475e] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                disabled={isDisabled}
                required
            />
            
            <div className="flex justify-end space-x-2 mt-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        disabled={isDisabled}
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={isDisabled || !content.trim()}
                >
                    {isDisabled ? 'Enviando...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
