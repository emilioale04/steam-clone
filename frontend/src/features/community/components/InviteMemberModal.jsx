import { useState } from 'react';
import { X, Search, UserPlus, Loader } from 'lucide-react';

export default function InviteMemberModal({ isOpen, onClose, onInvite }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [inviting, setInviting] = useState(false);

    const handleSearch = async (term) => {
        setSearchTerm(term);
        
        if (term.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const response = await fetch(`http://localhost:3000/api/community/groups/users/search?q=${encodeURIComponent(term)}`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            if (response.ok) {
                setSearchResults(data.data || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleInvite = async (userId) => {
        try {
            setInviting(true);
            await onInvite(userId);
            setSearchTerm('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error inviting user:', error);
        } finally {
            setInviting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2a475e]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={24} />
                        Invitar Miembro
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Search */}
                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2 font-semibold">
                            Buscar usuario por nombre
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Escribe el nombre de usuario..."
                                className="w-full pl-10 pr-4 py-3 bg-[#2a475e] text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            {searching && (
                                <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 animate-spin" size={20} />
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {searchTerm.trim().length >= 2 && (
                        <div>
                            <h3 className="text-white font-semibold mb-3">
                                Resultados ({searchResults.length})
                            </h3>
                            {searchResults.length === 0 && !searching && (
                                <div className="text-center py-8 text-gray-400">
                                    No se encontraron usuarios
                                </div>
                            )}
                            <div className="space-y-2">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="bg-[#2a475e] rounded-lg p-4 flex items-center justify-between hover:bg-[#3a576e] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#1b2838] rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {user.username?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    {user.username}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleInvite(user.id)}
                                            disabled={inviting}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <UserPlus size={16} />
                                            Invitar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchTerm.trim().length < 2 && (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="mx-auto mb-4 text-gray-500" size={48} />
                            <p>Escribe al menos 2 caracteres para buscar usuarios</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-[#2a475e]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors font-semibold"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
