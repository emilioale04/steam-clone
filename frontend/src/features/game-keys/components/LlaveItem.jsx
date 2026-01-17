import { Copy, Ban } from 'lucide-react';

export const LlaveItem = ({ llave, onCopiar, onDesactivar }) => {
  return (
    <div className="bg-[#2a3f5f] border border-[#3d5a80] rounded-lg p-4 hover:border-[#66c0f4] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <code className="text-[#66c0f4] font-mono text-lg">
              {llave.clave}
            </code>
            {llave.estado === 'Canjeada' && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                Canjeada
              </span>
            )}
            {llave.estado === 'Desactivada' && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                Desactivada
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>Creada: {new Date(llave.fecha_generacion).toLocaleDateString()}</span>
            {llave.fecha_desactivacion && (
              <span>Desactivada: {new Date(llave.fecha_desactivacion).toLocaleDateString()}</span>
            )}
            {llave.motivo_desactivacion && (
              <span title={llave.motivo_desactivacion} className="italic">
                Motivo: {llave.motivo_desactivacion.substring(0, 30)}...
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onCopiar(llave.clave)}
            className="p-2 bg-[#3d5a80] text-[#66c0f4] rounded hover:bg-[#4d6a90] transition-colors"
            title="Copiar llave"
          >
            <Copy className="w-4 h-4" />
          </button>
          {llave.estado === 'Activa' && (
            <button
              onClick={() => onDesactivar(llave.id)}
              className="p-2 bg-[#3d5a80] text-yellow-400 rounded hover:bg-yellow-900/20 transition-colors"
              title="Desactivar llave"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
