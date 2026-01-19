import { Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecommendedSection = ({ recommendedGroups = [] }) => {
  // Si no hay grupos recomendados, mostrar estado de espera
  if (!recommendedGroups || recommendedGroups.length === 0) {
    return (
      <div className="bg-[#16202d] rounded-xl p-4 border border-[#2a3f5f]">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">
            Recommended for you
          </h3>
          <p className="text-gray-400 text-xs">
            Descubre grupos basados en tus intereses
          </p>
        </div>

        {/* Empty State */}
        <div className="py-6 text-center bg-[#1b2838] rounded-lg border border-[#2a3f5f]">
          <div className="w-12 h-12 bg-[#2a3f5f] rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles size={20} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm mb-1">Sin recomendaciones aún</p>
          <p className="text-gray-500 text-xs">
            Únete a grupos para recibir sugerencias personalizadas
          </p>
        </div>
      </div>
    );
  }

  // Mostrar el primer grupo recomendado
  const recommendedGroup = recommendedGroups[0];

  return (
    <div className="bg-[#16202d] rounded-xl p-4 border border-[#2a3f5f]">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">
          Recommended for you
        </h3>
        <p className="text-gray-400 text-xs">
          Grupos populares que podrían interesarte
        </p>
      </div>

      {/* Recommended Group */}
      <Link
        to={`/community/groups/${recommendedGroup.id}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-[#1b2838] hover:bg-[#2a3f5f]/50 transition-colors group border border-[#2a3f5f]"
      >
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-lg ${recommendedGroup.color || 'bg-gradient-to-br from-cyan-600 to-blue-700'} flex items-center justify-center text-xl shadow-lg`}>
          {recommendedGroup.icon || recommendedGroup.avatar || '🎮'}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate group-hover:text-cyan-400 transition-colors">
            {recommendedGroup.name || recommendedGroup.nombre}
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
            <Users size={12} />
            <span>{recommendedGroup.memberCount || recommendedGroup.member_count || 0} Members</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RecommendedSection;
