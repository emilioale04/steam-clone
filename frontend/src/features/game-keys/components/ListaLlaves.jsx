import { Key } from 'lucide-react';
import { LlaveItem } from './LlaveItem';

export const ListaLlaves = ({ 
  llaves, 
  juegoActual, 
  loading, 
  onCopiar, 
  onDesactivar 
}) => {
  if (loading) {
    return (
      <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Llaves Generadas</h2>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#66c0f4] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">Cargando llaves...</p>
        </div>
      </div>
    );
  }

  if (!juegoActual) {
    return (
      <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Llaves Generadas</h2>
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            Selecciona un juego para ver sus llaves
          </p>
        </div>
      </div>
    );
  }

  if (llaves.length === 0) {
    return (
      <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Llaves Generadas
          <span className="text-gray-400 font-normal ml-2">
            - {juegoActual.nombre}
          </span>
        </h2>
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            No hay llaves generadas para este juego
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Usa el panel izquierdo para generar nuevas llaves
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Llaves Generadas
        <span className="text-gray-400 font-normal ml-2">
          - {juegoActual.nombre}
        </span>
      </h2>
      <div className="space-y-3">
        {llaves.map((llave) => (
          <LlaveItem
            key={llave.id}
            llave={llave}
            onCopiar={onCopiar}
            onDesactivar={onDesactivar}
          />
        ))}
      </div>
    </div>
  );
};
