/**
 * Componente de Verificación de MFA - Genérico para todos los módulos
 * Muestra un formulario para ingresar el código TOTP durante el login
 */

import { useState } from 'react';
import mfaService from '../services/mfaService';
import { getUserTypeConfig } from '../config/userTypes';

const MFAVerification = ({ 
  userId, 
  email, 
  userType = 'admin',
  onSuccess, 
  onCancel 
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = getUserTypeConfig(userType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await mfaService.verifyLoginCode(userId, code, userType);
      
      // Guardar token y datos del usuario usando las claves configuradas
      localStorage.setItem(config.tokenKey, response.token);
      if (response.refreshToken) {
        localStorage.setItem(config.refreshTokenKey, response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem(config.userKey, JSON.stringify(response.user));
      }

      onSuccess(response.user);
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Solo permitir números y máximo 8 caracteres (para códigos de respaldo también)
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#66c0f4]">Steam</span>works Admin
          </h1>
          <p className="text-gray-400 text-sm">
            Autenticación de Dos Factores
          </p>
        </div>

        <div className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Verificación de Dos Factores
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Ingresando como {config.displayName}: <span className="text-[#66c0f4]">{email}</span>
          </p>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="code" className="block text-gray-300 text-sm mb-2">
                Código de Autenticación
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength="8"
                required
                autoFocus
                className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] transition-colors"
              />
              <p className="text-gray-500 text-xs mt-2 text-center">
                Ingresa el código de 6 dígitos de tu app autenticadora
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 bg-linear-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Volver al login
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2a3f5f]">
            <p className="text-gray-400 text-xs text-center">
              ¿Perdiste tu dispositivo? También puedes usar un código de respaldo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>© 2026 Steam Clone - Panel Administrativo</p>
          <p className="mt-1">🔒 Sesión protegida con 2FA</p>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
