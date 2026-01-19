import PropTypes from 'prop-types';
import { Play, Lock, Gamepad2 } from 'lucide-react';
import { useAuth, ROLES } from '../../auth';

export const PlayButton = ({ game }) => {
    const { user, hasRole } = useAuth();

    const isLimited = !user || hasRole(ROLES.LIMITED);
    const isFamily = hasRole(ROLES.FAMILY);
    const isOwner = user?.id === game.ownerId;

    // Only FAMILY role is restricted by the owner's "busy" status.
    // Standard and Developer are "owners" and play normally.
    const isVariableBusy = isFamily && !isOwner && game.is_busy;

    let isDisabled = false;
    let reason = '';
    let Icon = Play;

    if (isLimited) {
        isDisabled = true;
        reason = 'Cuenta Limitada';
        Icon = Lock;
    } else if (isVariableBusy) {
        isDisabled = true;
        reason = 'Biblioteca en Uso';
        Icon = Gamepad2; // Representative of "Owner playing"
    }

    const handleClick = () => {
        if (!isDisabled) {
            alert(`¡Lanzando ${game.title}! El juego se está abriendo en una nueva ventana.`);
            console.log(`Lanzando juego: ${game.title}`);
            // Add launch logic here
        }
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <button
                onClick={handleClick}
                disabled={isDisabled}
                className={`
            flex items-center gap-2 px-6 py-3 rounded-sm font-bold text-white transition-all duration-200
            ${isDisabled
                        ? 'bg-gray-600 cursor-not-allowed opacity-70'
                        : 'bg-green-600 hover:bg-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] shadow-lg'
                    }
        `}
            >
                <Icon size={20} />
                <span>{isDisabled ? reason.toUpperCase() : 'JUGAR'}</span>
            </button>
            {isDisabled && (
                <span className="text-xs text-red-400">
                    {isLimited
                        ? 'Mejora tu cuenta para jugar.'
                        : 'El dueño está jugando este juego actualmente.'
                    }
                </span>
            )}
        </div>
    );
};

PlayButton.propTypes = {
    game: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        is_busy: PropTypes.bool,
    }).isRequired,
};
