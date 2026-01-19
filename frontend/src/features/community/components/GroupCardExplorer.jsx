import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupCardExplorer = ({ group }) => {
  // Determinar estilo del badge según el tipo
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'PUBLIC':
        return 'bg-green-500/90 text-white';
      case 'RESTRICTED':
        return 'bg-yellow-500/90 text-black';
      case 'PRIVATE':
        return 'bg-red-500/90 text-white';
      default:
        return 'bg-gray-500/90 text-white';
    }
  };

  // Determinar texto del botón según el tipo
  const getButtonConfig = (type) => {
    switch (type) {
      case 'PUBLIC':
        return { text: 'Join', style: 'bg-[#3a5070] hover:bg-[#4a6080] text-white' };
      case 'RESTRICTED':
        return { text: 'Apply', style: 'bg-yellow-600 hover:bg-yellow-500 text-white' };
      case 'PRIVATE':
        return { text: 'Request', style: 'bg-gray-600 hover:bg-gray-500 text-white' };
      default:
        return { text: 'Join', style: 'bg-[#3a5070] hover:bg-[#4a6080] text-white' };
    }
  };

  const badgeStyle = getBadgeStyle(group.type);
  const buttonConfig = getButtonConfig(group.type);

  return (
    <Link 
      to={`/community/groups/${group.id}`}
      className="block bg-[#16202d] rounded-xl overflow-hidden border border-[#2a3f5f] hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Image Container */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={group.image}
          alt={group.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${badgeStyle}`}>
            {group.type}
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
      <div className="p-4 pt-8">
        <h4 className="text-white font-semibold text-base mb-1 group-hover:text-cyan-400 transition-colors truncate">
          {group.name}
        </h4>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">
          {group.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users size={14} />
            <span>{group.memberCount} Members</span>
          </div>
          
          <button 
            onClick={(e) => e.preventDefault()}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${buttonConfig.style}`}
          >
            {buttonConfig.text}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default GroupCardExplorer;
