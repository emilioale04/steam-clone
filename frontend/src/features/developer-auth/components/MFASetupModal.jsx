/**
 * Componente: Modal de Configuración de MFA para Desarrolladores
 * Permite activar/desactivar autenticación de dos factores
 * Compatible con Microsoft Authenticator y otras apps TOTP
 */

import { useState, useEffect } from 'react';
import { developerProfileService } from '../services/developerProfileService';

export const MFASetupModal = ({
  isOpen,
  onClose,
  estadoMFAInicial,
  onMFAChanged,
  // Props legacy para compatibilidad
  qrCode: qrCodeProp,
  manualEntryKey: manualEntryKeyProp,
  onVerify,
  onSkip,
}) => {
  const [step, setStep] = useState(1); // 1: setup, 2: verify, 3: backup codes
  const [qrCode, setQrCode] = useState(qrCodeProp || '');
  const [manualKey, setManualKey] = useState(manualEntryKeyProp || '');
  const [codigo, setCodigo] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estadoMFA, setEstadoMFA] = useState(estadoMFAInicial);

  // Estados para deshabilitar MFA
  const [codigoDesactivar, setCodigoDesactivar] = useState('');
  const [mostrarDesactivar, setMostrarDesactivar] = useState(false);

  useEffect(() => {
    if (isOpen && !estadoMFA) {
      cargarEstadoMFA();
    }
  }, [isOpen]);

  const cargarEstadoMFA = async () => {
    try {
      const response = await developerProfileService.obtenerEstadoMFA();
      setEstadoMFA(response.data);
    } catch (err) {
      console.error('Error al cargar estado MFA:', err);
    }
  };

  const iniciarSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await developerProfileService.setupMFA();
      setQrCode(response.data.qrCode);
      setManualKey(response.data.manualEntryKey);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al configurar MFA');
    } finally {
      setLoading(false);
    }
  };

  const verificarYActivar = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Si viene el prop onVerify (modo legacy), usarlo
      if (onVerify) {
        const codes = await onVerify(codigo);
        if (codes && codes.length > 0) {
          setBackupCodes(codes);
          setStep(3);
        }
      } else {
        // Modo nuevo para perfil
        const response =
          await developerProfileService.verificarYActivarMFA(codigo);
        setBackupCodes(response.data.backupCodes);
        setStep(3);
        if (onMFAChanged) onMFAChanged();
      }
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const desactivarMFA = async (e) => {
    e.preventDefault();
    if (
      !confirm(
        '¿Estás seguro de que quieres deshabilitar MFA? Esto reducirá la seguridad de tu cuenta.',
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await developerProfileService.deshabilitarMFA(codigoDesactivar);
      if (onMFAChanged) onMFAChanged();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Error al deshabilitar MFA');
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigos = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert('Códigos de respaldo copiados al portapapeles');
  };

  const descargarCodigos = () => {
    const text =
      'CÓDIGOS DE RESPALDO - STEAMWORKS MFA\n\n' + backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'steamworks-backup-codes.txt';
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4'>
      <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='border-b border-[#2a3f5f] p-4 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>
            🔐 Autenticación de Dos Factores (MFA)
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white text-2xl'
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className='p-6'>
          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded'>
              <p className='text-red-400 text-sm'>{error}</p>
            </div>
          )}

          {/* Si MFA ya está activado */}
          {estadoMFA && estadoMFA.enabled && !mostrarDesactivar && (
            <div>
              <div className='bg-green-500/20 border border-green-500/50 rounded p-4 mb-4'>
                <p className='text-green-400 font-semibold mb-2'>
                  ✓ MFA Activado
                </p>
                <p className='text-gray-300 text-sm'>
                  Tu cuenta está protegida con autenticación de dos factores
                  usando Microsoft Authenticator u otra app TOTP.
                </p>
              </div>

              <button
                onClick={() => setMostrarDesactivar(true)}
                className='w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
              >
                Deshabilitar MFA
              </button>
            </div>
          )}

          {/* Formulario para deshabilitar */}
          {estadoMFA && estadoMFA.enabled && mostrarDesactivar && (
            <form onSubmit={desactivarMFA}>
              <div className='bg-yellow-500/20 border border-yellow-500/50 rounded p-4 mb-4'>
                <p className='text-yellow-400 text-sm'>
                  ⚠️ Al deshabilitar MFA, tu cuenta será menos segura. Deberás
                  ingresar un código de verificación para confirmar.
                </p>
              </div>

              <div className='mb-4'>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Código de Verificación
                </label>
                <input
                  type='text'
                  value={codigoDesactivar}
                  onChange={(e) =>
                    setCodigoDesactivar(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder='000000'
                  maxLength={6}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4] text-center text-2xl tracking-widest'
                  required
                  disabled={loading}
                />
              </div>

              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => setMostrarDesactivar(false)}
                  className='flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={loading || codigoDesactivar.length !== 6}
                  className='flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {loading ? 'Deshabilitando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}

          {/* Paso 1: Iniciar setup */}
          {(!estadoMFA || !estadoMFA.enabled) && step === 1 && (
            <div>
              <div className='mb-6'>
                <h3 className='text-white font-semibold mb-3'>¿Qué es MFA?</h3>
                <p className='text-gray-300 text-sm mb-3'>
                  La autenticación de dos factores (MFA) agrega una capa extra
                  de seguridad a tu cuenta. Además de tu contraseña, necesitarás
                  un código de 6 dígitos de tu aplicación autenticadora.
                </p>
                <div className='bg-[#16213e] p-4 rounded'>
                  <p className='text-gray-300 text-sm mb-2'>
                    📱 Aplicaciones compatibles:
                  </p>
                  <ul className='text-gray-400 text-xs space-y-1'>
                    <li>• Microsoft Authenticator (Recomendado)</li>
                    <li>• Google Authenticator</li>
                    <li>• Authy</li>
                    <li>• Cualquier app TOTP</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={iniciarSetup}
                disabled={loading}
                className='w-full px-4 py-3 bg-[#66c0f4] text-white font-semibold rounded hover:bg-[#5ab0e4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading ? 'Configurando...' : 'Configurar MFA'}
              </button>
            </div>
          )}

          {/* Paso 2: Escanear QR y verificar */}
          {step === 2 && (
            <form onSubmit={verificarYActivar}>
              <div className='mb-6'>
                <h3 className='text-white font-semibold mb-3'>
                  Paso 1: Escanea el código QR
                </h3>
                <p className='text-gray-300 text-sm mb-4'>
                  Abre Microsoft Authenticator y escanea este código:
                </p>

                {qrCode && (
                  <div className='bg-white p-4 rounded flex justify-center mb-4'>
                    <img
                      src={qrCode}
                      alt='QR Code'
                      className='w-48 h-48'
                    />
                  </div>
                )}

                <div className='bg-[#16213e] p-3 rounded'>
                  <p className='text-gray-400 text-xs mb-1'>
                    O ingresa esta clave manualmente:
                  </p>
                  <p className='text-white text-sm font-mono break-all'>
                    {manualKey}
                  </p>
                </div>
              </div>

              <div className='mb-6'>
                <h3 className='text-white font-semibold mb-3'>
                  Paso 2: Ingresa el código
                </h3>
                <p className='text-gray-300 text-sm mb-3'>
                  Ingresa el código de 6 dígitos que aparece en la app:
                </p>
                <input
                  type='text'
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder='000000'
                  maxLength={6}
                  className='w-full px-4 py-3 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4] text-center text-2xl tracking-widest'
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type='submit'
                disabled={loading || codigo.length !== 6}
                className='w-full px-4 py-3 bg-[#66c0f4] text-white font-semibold rounded hover:bg-[#5ab0e4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading ? 'Verificando...' : 'Verificar y Activar MFA'}
              </button>
            </form>
          )}

          {/* Paso 3: Códigos de respaldo */}
          {step === 3 && (
            <div>
              <div className='bg-yellow-500/20 border border-yellow-500/50 rounded p-4 mb-4'>
                <p className='text-yellow-400 font-semibold mb-2'>
                  ⚠️ ¡Importante!
                </p>
                <p className='text-gray-300 text-sm'>
                  Guarda estos códigos de respaldo en un lugar seguro. Puedes
                  usarlos para acceder si pierdes tu dispositivo.
                </p>
              </div>

              <div className='bg-[#16213e] p-4 rounded mb-4'>
                <div className='grid grid-cols-2 gap-2 mb-3'>
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className='text-white font-mono text-sm bg-[#1e2a38] px-3 py-2 rounded'
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex space-x-3 mb-4'>
                <button
                  type='button'
                  onClick={copiarCodigos}
                  className='flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
                >
                  📋 Copiar
                </button>
                <button
                  type='button'
                  onClick={descargarCodigos}
                  className='flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
                >
                  💾 Descargar
                </button>
              </div>

              <div className='bg-green-500/20 border border-green-500/50 rounded p-4 mb-4'>
                <p className='text-green-400 font-semibold'>
                  ✓ MFA Activado Exitosamente
                </p>
              </div>

              <button
                onClick={onClose || onSkip}
                className='w-full px-4 py-3 bg-[#66c0f4] text-white font-semibold rounded hover:bg-[#5ab0e4] transition-colors'
              >
                {onSkip ? 'Continuar al Dashboard →' : 'Finalizar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
