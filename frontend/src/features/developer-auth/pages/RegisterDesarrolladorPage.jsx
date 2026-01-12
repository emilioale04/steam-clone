/**
 * Página de Registro para Desarrolladores (Steamworks)
 */

import { useNavigate } from 'react-router-dom';
import { RegisterDesarrolladorForm } from '../components/RegisterDesarrolladorForm';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const RegisterDesarrolladorPage = () => {
  const navigate = useNavigate();
  const { registrar, error } = useDeveloperAuth();

  const handleRegister = async (datosRegistro) => {
    try {
      await registrar(datosRegistro);
      navigate('/steamworks/dashboard');
    } catch (err) {
      // Error manejado por el contexto
      console.error('Error en registro:', err);
    }
  };

  return <RegisterDesarrolladorForm onSubmit={handleRegister} error={error} />;
};
