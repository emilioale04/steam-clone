import { Users, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecommendedSection = ({ recommendedGroups = [], loading = false }) => {
  // Estado de carga
  if (loading) {
    return (
      <div className="bg-[#16202d] rounded-xl p-4 border border-[#2a3f5f]">
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">
            Recommended for you
          </h3>
        </div>
        <div className="py-6 text-center">
          <Loader2 size={24} className="text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  // Si no hay grupos recomendados, mostrar estado vacío
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

      {/* Recommended Groups List */}
      <div className="space-y-3">
        {recommendedGroups.slice(0, 3).map((group) => (
          <Link
            key={group.id}
            to={`/community/groups/${group.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#1b2838] hover:bg-[#2a3f5f]/50 transition-colors group border border-[#2a3f5f]"
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-lg ${group.color || 'bg-gradient-to-br from-cyan-600 to-blue-700'} flex items-center justify-center text-lg shadow-lg overflow-hidden`}>
              {group.image ? (
                <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                group.icon || group.avatar || '🎮'
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
                {group.name || group.nombre}
              </p>
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                <Users size={12} />
                <span>{group.memberCount || group.member_count || 0} miembros</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;
