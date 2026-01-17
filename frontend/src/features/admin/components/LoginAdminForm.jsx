/**
 * Formulario de Login para Administradores
 * Diseño oscuro estilo Steam con branding administrativo
 * Incluye soporte para MFA/TOTP obligatorio
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import MFAVerification from '../../mfa/components/MFAVerification';
import MFASetupRequired from '../../mfa/components/MFASetupRequired';

const LoginAdminForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [requiresSetupMFA, setRequiresSetupMFA] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  
  const { login, updateAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      // Si requiere configurar MFA (primera vez)
      if (result?.requiresSetupMFA) {
        setMfaData({
          adminId: result.adminId,
          email: result.email,
          tempToken: result.tempToken
        });
        setRequiresSetupMFA(true);
      }
      // Si requiere verificación MFA (ya configurado)
      else if (result?.requiresMFA) {
        setMfaData({
          adminId: result.adminId,
          email: result.email
        });
        setRequiresMFA(true);
      } else {
        // Login exitoso sin MFA (no debería pasar con el nuevo flujo)
        navigate('/steamworks/admin-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = (userData) => {
    // Actualizar el contexto con los datos del usuario
    if (userData) {
      updateAdmin(userData);
    }
    // Después de verificar MFA exitosamente, redirigir al dashboard
    navigate('/steamworks/admin-dashboard');
  };

  const handleMFACancel = () => {
    // Volver al formulario de login
    setRequiresMFA(false);
    setRequiresSetupMFA(false);
    setMfaData(null);
    setEmail('');
    setPassword('');
  };

  const handleSetupError = (error) => {
    // Si hay error en setup, volver al login
    setRequiresSetupMFA(false);
    setMfaData(null);
    setError(error.message || 'Error al configurar MFA');
  };

  // Si se requiere configurar MFA (primera vez)
  if (requiresSetupMFA && mfaData) {
    return (
      <MFASetupRequired
        userId={mfaData.adminId}
        email={mfaData.email}
        tempToken={mfaData.tempToken}
        userType="admin"
        onSuccess={handleMFASuccess}
        onError={handleSetupError}
      />
    );
  }

  // Si se requiere verificar MFA (ya configurado)
  if (requiresMFA && mfaData) {
    return (
      <MFAVerification
        userId={mfaData.adminId}
        email={mfaData.email}
        userType="admin"
        onSuccess={handleMFASuccess}
        onCancel={handleMFACancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#66c0f4]">Steam</span>works Admin
          </h1>
          <p className="text-gray-400 text-sm">
            Panel de Administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Acceso de Administrador
          </h2>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>© 2026 Steam Clone - Panel Administrativo</p>
          <p className="mt-1">
            <Link to="/" className="text-[#66c0f4] hover:underline">
              Volver a Steam
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginAdminForm;
