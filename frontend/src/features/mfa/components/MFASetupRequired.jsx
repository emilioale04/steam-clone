/**
 * Componente de Configuración Inicial de MFA - Genérico para todos los módulos
 * Se muestra durante el login cuando el usuario no tiene MFA configurado
 */

import { useState } from 'react';
import mfaService from '../services/mfaService';
import { getUserTypeConfig } from '../config/userTypes';

const MFASetupRequired = ({ 
  userId, 
  email, 
  tempToken, 
  userType = 'admin',
  onSuccess, 
  onError 
}) => {
  const [step, setStep] = useState('intro'); // intro, qr, verify, complete
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = getUserTypeConfig(userType);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await mfaService.setupInitial(userId, email, tempToken, userType);
      setQrCode(response.data.qrCode);
      setManualKey(response.data.manualEntryKey);
      setStep('qr');
    } catch (err) {
      setError(err.message);
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await mfaService.verifyAndEnableInitial(userId, verificationCode, tempToken, userType);
      
      // Guardar token y datos del usuario usando las claves configuradas
      localStorage.setItem(config.tokenKey, response.token);
      if (response.refreshToken) {
        localStorage.setItem(config.refreshTokenKey, response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem(config.userKey, JSON.stringify(response.user));
      }

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
    // Obtener datos del usuario desde localStorage
    const userData = JSON.parse(localStorage.getItem(config.userKey));
    onSuccess(userData);
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-[#66c0f4]">Steam</span>works Admin
            </h1>
            <p className="text-gray-400 text-sm">
              Configuración Requerida
            </p>
          </div>

          <div className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#4c6ef5] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Configuración de Seguridad Obligatoria
            </h2>

            <div className="bg-blue-900/30 border border-blue-500 rounded p-4 mb-6">
              <p className="text-blue-200 text-sm mb-3">
                <strong>Autenticación de Dos Factores (2FA)</strong>
              </p>
              <p className="text-blue-100 text-sm mb-2">
                Para proteger el panel de administración, todos los administradores deben configurar autenticación de dos factores.
              </p>
              <ul className="text-blue-100 text-sm space-y-1 list-disc list-inside">
                <li>Protección adicional de tu cuenta</li>
                <li>Prevención de accesos no autorizados</li>
                <li>Cumplimiento de políticas de seguridad</li>
              </ul>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500 rounded p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                <strong>📱 Necesitarás:</strong>
              </p>
              <p className="text-yellow-100 text-sm">
                Una aplicación autenticadora instalada en tu móvil (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Configurar Ahora'}
            </button>
          </div>

          <div className="mt-6 text-center text-gray-500 text-xs">
            <p>© 2026 Steam Clone - Panel Administrativo</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-[#66c0f4]">Steam</span>works Admin
            </h1>
            <p className="text-gray-400 text-sm">
              Configuración de 2FA
            </p>
          </div>

          <div className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Escanea el Código QR
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4 text-center">
                <strong>Paso 1:</strong> Escanea este código QR con tu aplicación autenticadora
              </p>
              
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded inline-block">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-2 text-center text-sm">
                ¿No puedes escanear? Ingresa esta clave manualmente:
              </p>
              <div className="bg-[#2a3f5f] p-3 rounded">
                <code className="text-[#66c0f4] text-sm break-all block text-center">{manualKey}</code>
              </div>
            </div>

            <form onSubmit={handleVerifyCode}>
              <p className="text-gray-300 mb-3 text-center">
                <strong>Paso 2:</strong> Ingresa el código de 6 dígitos de tu aplicación
              </p>
              
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
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
                autoFocus
                className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white text-center text-2xl tracking-widest mb-4 focus:outline-none focus:border-[#66c0f4]"
              />

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full px-4 py-3 bg-linear-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar y Continuar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-[#66c0f4]">Steam</span>works Admin
            </h1>
            <p className="text-gray-400 text-sm">
              Configuración Completada
            </p>
          </div>

          <div className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">
                ¡2FA Configurado!
              </h2>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500 rounded p-4 mb-6">
              <p className="text-yellow-200 font-semibold mb-3 flex items-center gap-2">
                <span>⚠️</span> Códigos de Respaldo - ¡GUÁRDALOS AHORA!
              </p>
              <p className="text-yellow-100 text-sm mb-3">
                Estos códigos te permitirán acceder si pierdes tu dispositivo. Cada código solo puede usarse una vez.
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
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-semibold"
              >
                📥 Descargar Códigos
              </button>
            </div>

            <div className="bg-green-900/30 border border-green-500 rounded p-4 mb-6">
              <p className="text-green-200 text-sm text-center">
                ✓ Tu cuenta ahora está protegida con autenticación de dos factores
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full px-4 py-3 bg-linear-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all"
            >
              Continuar al Panel de Administración
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MFASetupRequired;
