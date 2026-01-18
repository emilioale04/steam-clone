import { Search, Circle } from 'lucide-react';

const FriendsSidebar = ({ friends }) => {
  return (
    <div className="border-t border-[#2a3f5f] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Friends</h3>
        <button className="text-gray-500 hover:text-white transition-colors">
          <Search size={14} />
        </button>
      </div>
      
      <div className="space-y-2">
        {friends.map((friend) => (
          <FriendItem key={friend.id} friend={friend} />
        ))}
      </div>
    </div>
  );
};

const FriendItem = ({ friend }) => {
  return (
    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a3f5f]/50 transition-colors group">
      {/* Avatar */}
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {friend.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Status Indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#171a21] ${
            friend.inGame ? 'bg-green-500' : friend.online ? 'bg-cyan-400' : 'bg-gray-500'
          }`}
        />
      </div>
      
      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
          {friend.name}
        </p>
        <p className={`text-xs truncate ${friend.inGame ? 'text-green-400' : 'text-gray-400'}`}>
          {friend.status}
        </p>
      </div>
    </button>
  );
};

export default FriendsSidebar;
