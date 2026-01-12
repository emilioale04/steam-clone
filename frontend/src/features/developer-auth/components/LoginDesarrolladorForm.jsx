/**
 * Formulario de Login para Desarrolladores (Steamworks)
 * Diseño oscuro estilo Steam con branding de Steamworks
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export const LoginDesarrolladorForm = ({ onSubmit, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Steamworks */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#66c0f4]">Steam</span>works
          </h1>
          <p className="text-gray-400 text-sm">
            Portal de Desarrolladores
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Iniciar Sesión como Desarrollador
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
                placeholder="tu@email.com"
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
              className="w-full py-3 bg-gradient-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="mt-6 text-center space-y-3">
            <Link
              to="/steamworks/forgot-password"
              className="text-[#66c0f4] hover:text-[#8ad0f8] text-sm block"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            
            <div className="text-gray-400 text-sm">
              ¿No tienes cuenta de desarrollador?{' '}
              <Link
                to="/steamworks/registro"
                className="text-[#66c0f4] hover:text-[#8ad0f8] font-medium"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>© 2026 Steam Clone - Componente Steamworks</p>
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
