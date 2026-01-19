import React, { useState } from 'react';
import { MFAVerificationModal } from './MFAVerificationModal';

export function DiscountEditor({
  selectedGame,
  discount,
  setDiscount,
  onSubmit,
  loading,
  disabled
}) {
  const [showMfaModal, setShowMfaModal] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowMfaModal(true);
  };

  const handleMfaVerify = async (codigoMFA) => {
    try {
      await onSubmit(codigoMFA);
      setShowMfaModal(false);
    } catch (error) {
      // El error se maneja en el modal
      throw error;
    }
  };

  return (
    <>
      <form
        className="p-0 rounded-md"
        onSubmit={handleFormSubmit}
      >
        <label className="block text-white mb-2">Descuento (%)</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          className="w-full bg-slate-900 border border-slate-600 p-2 rounded mb-4 text-white"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          required
          disabled={!selectedGame}
        />
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-2 bg-green-900/30 text-[#d2eba3] px-4 py-2 rounded text-xs border border-green-800">
            <span role="img" aria-label="lock">🔒</span> Verificación MFA requerida para cambios de descuento
          </div>
          <button
            type="submit"
            className="bg-[#617509] hover:bg-[#86a50d] text-[#d2eba3] px-6 py-2 rounded-sm transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || loading || !selectedGame}
          >
            {loading ? 'Actualizando...' : 'Actualizar Descuento'}
          </button>
        </div>
      </form>

      <MFAVerificationModal
        isOpen={showMfaModal}
        onClose={() => setShowMfaModal(false)}
        onVerify={handleMfaVerify}
        title="Confirmar Cambio de Descuento"
        loading={loading}
      />
    </>
  );
}