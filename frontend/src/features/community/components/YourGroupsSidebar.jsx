import { ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const YourGroupsSidebar = ({ groups, onViewAllClick }) => {
  return (
    <div className="bg-[#16202d] rounded-xl p-4 border border-[#2a3f5f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Your Groups</h3>
        <span className="text-gray-400 text-xs">{groups.length} Joined</span>
      </div>

      {/* Groups List or Empty State */}
      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupListItem key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="w-12 h-12 bg-[#2a3f5f] rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No has unido a ningún grupo aún</p>
        </div>
      )}

      {/* View All Button - Always visible and functional */}
      <button 
        onClick={onViewAllClick}
        className="w-full mt-4 py-2.5 text-center text-gray-400 hover:text-white text-sm border border-[#2a3f5f] hover:border-[#3a5070] rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View All My Groups
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const GroupListItem = ({ group }) => {
  return (
    <Link
      to={`/community/groups/${group.id}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a3f5f]/50 transition-colors group"
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-lg ${group.color} flex items-center justify-center text-lg`}>
        {group.avatar}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
          {group.name}
        </p>
        {group.subtitle && (
          <p className="text-gray-400 text-xs truncate">
            {group.subtitle}
          </p>
        )}
      </div>
    </Link>
  );
};

export default YourGroupsSidebar;
