import { Users, Check, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupCardExplorer = ({ group, onJoin, isMember = false, isPending = false }) => {
  // Determinar estilo del badge según el tipo
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'PUBLIC':
        return 'bg-green-500/90 text-white';
      case 'RESTRICTED':
        return 'bg-yellow-500/90 text-black';
      case 'PRIVATE':
        return 'bg-red-500/90 text-white';
      case 'MEMBER':
        return 'bg-cyan-500/90 text-white';
      default:
        return 'bg-gray-500/90 text-white';
    }
  };

  // Determinar configuración del botón según el estado
  const getButtonConfig = () => {
    // Si ya es miembro
    if (isMember || group.type === 'MEMBER') {
      return { 
        text: 'Unido', 
        style: 'bg-gray-600 text-gray-300 cursor-default',
        icon: <Check size={14} />,
        disabled: true 
      };
    }
    
    // Si tiene solicitud pendiente
    if (isPending) {
      return { 
        text: 'Pendiente', 
        style: 'bg-yellow-700 text-yellow-200 cursor-default',
        icon: <Clock size={14} />,
        disabled: true 
      };
    }

    // Según el tipo de grupo
    switch (group.type) {
      case 'PUBLIC':
        return { 
          text: 'Unirse', 
          style: 'bg-green-600 hover:bg-green-500 text-white',
          icon: null,
          disabled: false 
        };
      case 'RESTRICTED':
        return { 
          text: 'Solicitar', 
          style: 'bg-yellow-600 hover:bg-yellow-500 text-white',
          icon: null,
          disabled: false 
        };
      case 'PRIVATE':
        return { 
          text: 'Solo Invitación', 
          style: 'bg-gray-600 text-gray-400 cursor-not-allowed',
          icon: <Lock size={14} />,
          disabled: true 
        };
      default:
        return { 
          text: 'Unirse', 
          style: 'bg-[#3a5070] hover:bg-[#4a6080] text-white',
          icon: null,
          disabled: false 
        };
    }
  };

  const badgeStyle = getBadgeStyle(group.type);
  const buttonConfig = getButtonConfig();

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonConfig.disabled || !onJoin) return;
    
    onJoin(group.id, group.type);
  };

  return (
    <Link 
      to={`/community/groups/${group.id}`}
      className="flex flex-col bg-[#16202d] rounded-xl overflow-hidden border border-[#2a3f5f] hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 group h-full cursor-pointer"
    >
      {/* Image Container - Poster Header */}
      <div className="relative w-full h-40 overflow-hidden">
        <img
          src={group.image}
          alt={group.name}
          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
        />
        
        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${badgeStyle}`}>
            {group.type === 'MEMBER' ? 'UNIDO' : group.type}
          </span>
        </div>

        {/* Icon Overlay */}
        <div className="absolute bottom-0 left-0 translate-y-1/2 ml-4">
          <div className="w-12 h-12 bg-[#2a3f5f] rounded-lg flex items-center justify-center text-xl border-2 border-[#16202d] shadow-lg">
            {group.icon}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-8 flex flex-col flex-1">
        <h4 className="text-cyan-400 font-semibold text-lg mb-1 group-hover:text-cyan-300 transition-colors truncate">
          {group.name}
        </h4>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
          {group.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2a3f5f]/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users size={14} />
            <span>{group.memberCount} miembros</span>
          </div>
          
          <button 
            onClick={handleButtonClick}
            disabled={buttonConfig.disabled}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1.5 ${buttonConfig.style}`}
          >
            {buttonConfig.icon}
            {buttonConfig.text}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default GroupCardExplorer;
