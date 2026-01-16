/**
 * Componente de Configuración de MFA - Genérico para todos los módulos
 * Permite al usuario configurar TOTP con código QR
 */

import { useState } from 'react';
import mfaService from '../services/mfaService';

const MFASetup = ({ token, userType = 'admin', onSuccess, onCancel }) => {
  const [step, setStep] = useState('initial'); // initial, qr, verify, complete
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await mfaService.setupMFA(token);
      setQrCode(response.data.qrCode);
      setManualKey(response.data.manualEntryKey);
      setStep('qr');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await mfaService.verifyAndEnable(token, verificationCode);
      setBackupCodes(response.backupCodes);
      setStep('complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steam-${userType}-backup-codes.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onSuccess();
  };

  if (step === 'initial') {
    return (
      <div className="bg-[#1e2a38] rounded-lg p-6 border border-[#2a3f5f]">
        <h3 className="text-xl font-semibold text-white mb-4">
          Configurar Autenticación de Dos Factores
        </h3>
        <p className="text-gray-300 mb-4">
          Añade una capa adicional de seguridad a tu cuenta usando autenticación TOTP.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Necesitarás una aplicación autenticadora como Google Authenticator, Authy o Microsoft Authenticator.
        </p>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="px-4 py-2 bg-[#4c6ef5] text-white rounded hover:bg-[#5c7cfa] transition-colors disabled:opacity-50"
          >
            {loading ? 'Configurando...' : 'Comenzar Configuración'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="bg-[#1e2a38] rounded-lg p-6 border border-[#2a3f5f]">
        <h3 className="text-xl font-semibold text-white mb-4">
          Escanea el Código QR
        </h3>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Paso 1: Escanea este código QR con tu aplicación autenticadora:
          </p>
          
          <div className="bg-white p-4 rounded inline-block">
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            ¿No puedes escanear el código? Ingresa esta clave manualmente:
          </p>
          <div className="bg-[#2a3f5f] p-3 rounded">
            <code className="text-[#66c0f4] text-sm break-all">{manualKey}</code>
          </div>
        </div>

        <form onSubmit={handleVerifyCode}>
          <p className="text-gray-300 mb-2">
            Paso 2: Ingresa el código de 6 dígitos de tu aplicación:
          </p>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            required
            className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white text-center text-2xl tracking-widest mb-4"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="px-4 py-2 bg-[#4c6ef5] text-white rounded hover:bg-[#5c7cfa] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar y Activar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="bg-[#1e2a38] rounded-lg p-6 border border-[#2a3f5f]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white">
            ¡MFA Activado Exitosamente!
          </h3>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-500 rounded p-4 mb-4">
          <p className="text-yellow-200 font-semibold mb-2">
            ⚠️ Códigos de Respaldo
          </p>
          <p className="text-yellow-100 text-sm mb-3">
            Guarda estos códigos en un lugar seguro. Puedes usarlos para acceder a tu cuenta si pierdes tu dispositivo.
          </p>
          
          <div className="bg-[#2a3f5f] p-4 rounded mb-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-[#66c0f4] text-sm">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadBackupCodes}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
          >
            📥 Descargar Códigos
          </button>
        </div>

        <button
          onClick={handleComplete}
          className="w-full px-4 py-2 bg-[#4c6ef5] text-white rounded hover:bg-[#5c7cfa] transition-colors"
        >
          Finalizar
        </button>
      </div>
    );
  }

  return null;
};

export default MFASetup;
