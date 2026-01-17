import { Ban, X } from 'lucide-react';

export const ModalDesactivarLlave = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  motivo, 
  onMotivoChange, 
  loading 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Ban className="w-5 h-5 mr-2 text-yellow-400" />
            Desactivar Llave
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <p className="text-gray-300 mb-4">
            Por favor indica el motivo por el cual deseas desactivar esta llave:
          </p>
          
          <textarea
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            placeholder="Ej: Llave comprometida, generada por error, etc."
            className="w-full bg-[#2a3f5f] border border-[#3d5a80] text-white px-4 py-3 rounded focus:border-[#66c0f4] focus:outline-none resize-none mb-4"
            rows="3"
            maxLength="200"
            disabled={loading}
            required
          />
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!motivo.trim() || loading}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
