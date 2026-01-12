/**
 * Ruta Protegida para Desarrolladores (Steamworks)
 * Solo permite acceso a usuarios autenticados como desarrolladores
 */

import { Navigate } from 'react-router-dom';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const ProtectedDeveloperRoute = ({ children }) => {
  const { isAuthenticated, loading } = useDeveloperAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#66c0f4] mx-auto mb-4"></div>
          <p className="text-white">Verificando sesión de desarrollador...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/steamworks/login" replace />;
  }

  return children;
};
