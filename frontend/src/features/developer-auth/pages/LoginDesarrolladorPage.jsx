/**
 * Página de Login para Desarrolladores (Steamworks)
 */

import { useNavigate } from 'react-router-dom';
import { LoginDesarrolladorForm } from '../components/LoginDesarrolladorForm';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const LoginDesarrolladorPage = () => {
  const navigate = useNavigate();
  const { login, error } = useDeveloperAuth();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/steamworks/dashboard');
    } catch (err) {
      // Error manejado por el contexto
      console.error('Error en login:', err);
    }
  };

  return <LoginDesarrolladorForm onSubmit={handleLogin} error={error} />;
};
