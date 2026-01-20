import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function GroupCard({ group, showMemberBadge = false }) {
    const getVisibilityBadge = () => {
        const badges = {
            Open: { text: 'Abierto', color: 'bg-green-900/40 text-green-400 border border-green-500/50' },
            Restricted: { text: 'Restringido', color: 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/50' },
            Closed: { text: 'Privado', color: 'bg-red-900/40 text-red-400 border border-red-500/50' }
        };
        
        const badge = badges[group.visibilidad] || badges.Open;
        
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const isMember = showMemberBadge && group.is_member;

    return (
        <Link 
            to={`/community/groups/${group.id}`}
            className="block bg-[#16202d] rounded-lg border border-transparent hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden group cursor-pointer"
        >
            {/* Avatar grande arriba */}
            <div className="relative w-full h-40 overflow-hidden bg-[#1b2838]">
                {group.avatar_url ? (
                    <img 
                        src={group.avatar_url} 
                        alt={group.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex items-center justify-center transition-transform duration-300 ease-in-out group-hover:scale-110">
                        <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                    </div>
                )}
                {/* Badge de JOINED si es miembro */}
                {isMember && (
                    <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-cyan-500/90 text-white flex items-center gap-1">
                            <Check size={12} />
                            UNIDO
                        </span>
                    </div>
                )}
                {/* Badge de visibilidad sobre la imagen (solo si no es miembro) */}
                {!isMember && (
                    <div className="absolute top-2 right-2">
                        {getVisibilityBadge()}
                    </div>
                )}
            </div>

            {/* Información debajo */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                    {group.nombre}
                </h3>
                
                <p className="text-sm text-gray-400 mt-2 line-clamp-2 min-h-[2.5rem]">
                    {group.descripcion || 'Sin descripción'}
                </p>
                
                <div className="flex items-center mt-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{group.member_count || 0} miembros</span>
                </div>
            </div>
        </Link>
    );
}
