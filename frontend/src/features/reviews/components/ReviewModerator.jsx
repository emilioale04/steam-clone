import PropTypes from 'prop-types';
import { Trash2, ShieldCheck } from 'lucide-react';
import { useAuth, ROLES } from '../../auth';

export const ReviewModerator = ({ reviewId, onDelete }) => {
    const { hasRole } = useAuth();

    // Only render for Developers
    if (!hasRole(ROLES.DEVELOPER)) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-1 text-xs text-orange-400 font-mono">
                <ShieldCheck size={12} />
                <span>MODERATOR ACTIONS</span>
            </div>
            <button
                onClick={() => onDelete(reviewId)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-200 hover:bg-red-900/30 rounded transition-colors"
                aria-label="Delete review"
            >
                <Trash2 size={14} />
                <span>Delete</span>
            </button>
        </div>
    );
};

ReviewModerator.propTypes = {
    reviewId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onDelete: PropTypes.func.isRequired,
};
