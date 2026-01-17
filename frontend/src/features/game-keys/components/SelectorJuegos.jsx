import { Key } from 'lucide-react';

export const SelectorJuegos = ({ juegos, juegoSeleccionado, onSeleccionar }) => {
  return (
    <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Key className="w-5 h-5 mr-2 text-[#66c0f4]" />
        Seleccionar Juego
      </h2>
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
        {juegos.map((juego) => (
          <button
            key={juego.id}
            onClick={() => onSeleccionar(juego.id)}
            className={`w-full text-left p-3 rounded border transition-colors ${
              juegoSeleccionado === juego.id
                ? 'bg-[#66c0f4]/20 border-[#66c0f4] text-white'
                : 'bg-[#2a3f5f] border-[#3d5a80] text-gray-300 hover:border-[#66c0f4]'
            }`}
          >
            <div className="font-medium">{juego.nombre}</div>
            <div className="text-xs text-gray-400 mt-1">
              {juego.llaves_activas !== undefined ? (
                `Llaves: ${juego.llaves_activas}/${juego.llaves_maximas || 5}`
              ) : (
                'Haz clic para ver llaves'
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
