/**
 * Componente de Configuración de Seguridad para Administradores
 * Permite configurar MFA/TOTP desde el dashboard
 */

import { useState, useEffect } from 'react';
import { MFASetup } from '../../mfa/components';
import mfaService from '../../mfa/services/mfaService';

const MFASettings = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await mfaService.getMFAStatus(token);
      setMfaEnabled(response.data.mfaEnabled);
    } catch (err) {
      console.error('Error al verificar estado de MFA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = () => {
    setShowSetup(true);
  };

  const handleMFASuccess = () => {
    setShowSetup(false);
    setMfaEnabled(true);
    setError('');
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('¿Estás seguro de que deseas deshabilitar MFA? Esto reducirá la seguridad de tu cuenta.')) {
      return;
    }

    const password = window.prompt('Ingresa tu contraseña para confirmar:');
    if (!password) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      await mfaService.disableMFA(token, password);
      setMfaEnabled(false);
      alert('MFA deshabilitado exitosamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!window.confirm('¿Deseas regenerar tus códigos de respaldo? Los códigos anteriores dejarán de funcionar.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await mfaService.regenerateBackupCodes(token);
      
      // Mostrar códigos
      const codes = response.backupCodes.join('\n');
      alert(`Nuevos códigos de respaldo:\n\n${codes}\n\n¡Guárdalos en un lugar seguro!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showSetup) {
    return (
      <div className="bg-[#1e2a38] rounded-lg p-6 border border-[#2a3f5f]">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (showSetup) {
    return (
      <MFASetup
        token={localStorage.getItem('adminToken')}
        userType="admin"
        onSuccess={handleMFASuccess}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="bg-[#1e2a38] rounded-lg p-6 border border-[#2a3f5f]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Autenticación de Dos Factores (2FA)
          </h3>
          <p className="text-gray-400 text-sm">
            Protege tu cuenta con un segundo factor de autenticación
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded text-sm font-semibold ${
          mfaEnabled 
            ? 'bg-green-900/30 text-green-400 border border-green-500' 
            : 'bg-gray-700 text-gray-400'
        }`}>
          {mfaEnabled ? '🔒 Activado' : 'Desactivado'}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {!mfaEnabled ? (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
            <p className="text-blue-200 text-sm mb-2">
              <strong>¿Por qué activar 2FA?</strong>
            </p>
            <ul className="text-blue-100 text-sm space-y-1 list-disc list-inside">
              <li>Protección adicional contra accesos no autorizados</li>
              <li>Seguridad incluso si tu contraseña es comprometida</li>
              <li>Cumplimiento con mejores prácticas de seguridad</li>
            </ul>
          </div>

          <button
            onClick={handleEnableMFA}
            className="px-4 py-2 bg-[#4c6ef5] text-white rounded hover:bg-[#5c7cfa] transition-colors"
          >
            Activar 2FA
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500 rounded p-4">
            <p className="text-green-200 text-sm">
              ✓ Tu cuenta está protegida con autenticación de dos factores
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Regenerar Códigos de Respaldo
            </button>
            
            <button
              onClick={handleDisableMFA}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Deshabilitar 2FA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASettings;
