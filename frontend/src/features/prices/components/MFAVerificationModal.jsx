/**
 * Componente: Modal de Verificación MFA
 * Solicita código TOTP antes de realizar acciones sensibles
 * 
 * Diseño consistente con developer-auth/components/MFAVerificationModal
 */

import { useState } from 'react';

export const MFAVerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  title = 'Verificación MFA Requerida',
  loading: externalLoading = false
}) => {
  const [codigoMFA, setCodigoMFA] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLoading = loading || externalLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!codigoMFA || codigoMFA.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await onVerify(codigoMFA);
      setCodigoMFA('');
      onClose();
    } catch (err) {
      setError(err.message || 'Código MFA inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setCodigoMFA('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 max-w-md w-full mx-4'>
        <h3 className='text-xl font-semibold text-white mb-4'>{title}</h3>

        <p className='text-gray-400 text-sm mb-6'>
          Por seguridad, ingresa el código de 6 dígitos de tu aplicación
          autenticadora (Microsoft Authenticator, Google Authenticator, etc.)
        </p>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Código MFA
            </label>
            <input
              type='text'
              maxLength='6'
              pattern='[0-9]{6}'
              value={codigoMFA}
              onChange={(e) => setCodigoMFA(e.target.value.replace(/\D/g, ''))}
              className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4] text-center text-2xl tracking-widest'
              placeholder='000000'
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded'>
              <p className='text-red-400 text-sm'>{error}</p>
            </div>
          )}

          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isLoading || codigoMFA.length !== 6}
              className='flex-1 px-4 py-2 bg-[#66c0f4] text-white rounded hover:bg-[#5ab0e4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MFAVerificationModal;
