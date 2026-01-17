import { AlertCircle, CheckCircle } from 'lucide-react';

export const Notificacion = ({ mensaje, tipo, onClose }) => {
  if (!mensaje) return null;

  const isSuccess = tipo === 'success';
  const Icon = isSuccess ? CheckCircle : AlertCircle;
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div
        className={`flex items-center space-x-2 p-4 rounded-lg border ${
          isSuccess
            ? 'bg-green-900/20 border-green-500/50 text-green-400'
            : 'bg-red-900/20 border-red-500/50 text-red-400'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="flex-1">{mensaje}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-current hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
