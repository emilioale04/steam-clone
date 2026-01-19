import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { Lock, TrendingUp, RefreshCw, Gamepad2 } from 'lucide-react';

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
				<div
					key={item.id}
					className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-400 transition-colors relative"
				>
					{/* Status indicators */}
					<div className="absolute top-2 right-2 flex gap-1 z-10">
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

					<div className="p-3">
						{/* Nombre del item */}
						<h3 className="text-white text-sm font-medium truncate" title={item.name}>
							{item.name || 'Item Desconocido'}
						</h3>

						{/* Nombre de la aplicación/juego */}
						<div className="flex items-center gap-1 mt-1">
							<Gamepad2 size={12} className="text-blue-400" />
							<p className="text-blue-400 text-xs truncate" title={item.app_name}>
								{item.app_name || 'App desconocida'}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
