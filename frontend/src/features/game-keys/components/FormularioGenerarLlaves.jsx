
import { Plus } from 'lucide-react';

export const FormularioGenerarLlaves = ({ 
  llavesDisponibles, 
  cantidad, 
  onCantidadChange, 
  onGenerar, 
  loading 
}) => {
  return (
    <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-[#66c0f4]" />
        Generar Llaves
      </h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Llaves disponibles:</span>
          <span className={`font-bold ${llavesDisponibles > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {llavesDisponibles}
          </span>
        </div>
        <div className="w-full bg-[#2a3f5f] rounded-full h-2">
          <div
            className="bg-[#66c0f4] h-2 rounded-full transition-all"
            style={{ width: `${((5 - llavesDisponibles) / 5) * 100}%` }}
          />
        </div>
      </div>

      {llavesDisponibles > 0 ? (
        <>
          <label className="block text-gray-400 text-sm mb-2">
            Cantidad (máx: {llavesDisponibles})
          </label>
          <input
            type="number"
            min="1"
            max={llavesDisponibles}
            value={cantidad}
            onChange={(e) => onCantidadChange(Math.min(parseInt(e.target.value) || 1, llavesDisponibles))}
            className="w-full bg-[#2a3f5f] border border-[#3d5a80] text-white px-4 py-2 rounded focus:border-[#66c0f4] focus:outline-none mb-4"
            disabled={loading}
          />
          <button
            onClick={onGenerar}
            disabled={loading}
            className="w-full bg-[#66c0f4] text-white py-2 rounded font-medium hover:bg-[#5ab0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generando...' : `Generar ${cantidad} Llave${cantidad > 1 ? 's' : ''}`}
          </button>
        </>
      ) : (
        <div className="bg-yellow-900/20 border border-yellow-500/50 text-yellow-400 p-3 rounded text-sm">
          Has alcanzado el límite máximo de 5 llaves para este juego.
        </div>
      )}
    </div>
  );
};
