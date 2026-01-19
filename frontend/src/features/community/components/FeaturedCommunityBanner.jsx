import { ChevronRight, Users } from 'lucide-react';

const FeaturedCommunityBanner = ({ community }) => {
  return (
    <div className="relative rounded-xl overflow-hidden h-64 md:h-80 group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${community.image})` 
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        {/* Featured Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-cyan-500/90 text-white text-xs font-bold uppercase tracking-wide rounded">
            Featured Community
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-2xl md:text-4xl font-bold mb-3">
          {community.name}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm md:text-base mb-4 max-w-lg">
          {community.description}
        </p>

        {/* Stats & CTA */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400">{community.onlineCount} Online</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} />
            <span>{community.memberCount} Members</span>
          </div>
          
          <button className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-500/30">
            Join Group
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCommunityBanner;
