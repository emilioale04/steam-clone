import React, { useState } from 'react';

export function DiscountEditor({
  selectedGame,
  discount,
  setDiscount,
  onSubmit,
  loading,
  disabled
}) {
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowMfaModal(true);
  };

  const handleMfaConfirm = () => {
    setShowMfaModal(false);
    onSubmit(mfaCode);
    setMfaCode('');
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
      {showMfaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-xs">
            <h3 className="text-lg font-bold text-white mb-4">Verificación MFA</h3>
            <input
              type="text"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder="Código MFA"
              className="w-full bg-slate-900 border border-slate-600 p-2 rounded mb-4 text-white"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowMfaModal(false)}
                type="button"
              >Cancelar</button>
              <button
                className="bg-lime-600 hover:bg-lime-500 text-white px-4 py-2 rounded font-medium"
                onClick={handleMfaConfirm}
                disabled={!mfaCode}
                type="button"
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}