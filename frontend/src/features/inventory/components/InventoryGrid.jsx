import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { Lock, TrendingUp, RefreshCw } from 'lucide-react';

export const InventoryGrid = ({ userId }) => {
    const { inventory, loading, error } = useInventory(userId);

    if (loading) return <div className="text-white p-4">Cargando inventario...</div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
    if (!inventory || inventory.length === 0) {
        return <div className="text-gray-400 p-4">Este inventario está vacío o es privado.</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {inventory.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors relative">
                    {/* Item image placeholder - Steam items would have their own images */}
                    <div className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <span className="text-gray-500 text-xs text-center px-2">Item #{item.steam_item_id}</span>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                        {item.is_locked && (
                            <div className="bg-red-500/80 p-1 rounded" title="Bloqueado">
                                <Lock size={12} className="text-white" />
                            </div>
                        )}
                        {item.is_tradeable && (
                            <div className="bg-green-500/80 p-1 rounded" title="Intercambiable">
                                <RefreshCw size={12} className="text-white" />
                            </div>
                        )}
                        {item.is_marketable && (
                            <div className="bg-blue-500/80 p-1 rounded" title="Vendible">
                                <TrendingUp size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                    
                    <div className="p-2">
                        <h3 className="text-white text-sm font-medium truncate">Steam Item</h3>
                        <p className="text-gray-400 text-xs">ID: {item.steam_item_id}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
