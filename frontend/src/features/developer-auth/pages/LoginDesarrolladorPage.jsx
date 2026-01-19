/**
 * Página de Login para Desarrolladores (Steamworks)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginDesarrolladorForm } from '../components/LoginDesarrolladorForm';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const LoginDesarrolladorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, error } = useDeveloperAuth();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Verificar si viene de verificación exitosa
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShowVerificationMessage(true);
      // Limpiar el parámetro después de 5 segundos
      setTimeout(() => setShowVerificationMessage(false), 5000);
    }
  }, [searchParams]);

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/steamworks/dashboard');
    } catch (err) {
      // Error manejado por el contexto
      console.error('Error en login:', err);
    }
  };

  return (
    <>
      {showVerificationMessage && (
        <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4'>
          <div className='bg-green-900/90 border border-green-500 text-green-100 px-6 py-4 rounded-lg shadow-lg'>
            <div className='flex items-center'>
              <svg
                className='w-6 h-6 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <div>
                <p className='font-semibold'>¡Email verificado exitosamente!</p>
                <p className='text-sm'>Ahora puedes iniciar sesión</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <LoginDesarrolladorForm
        onSubmit={handleLogin}
        error={error}
      />
    </>
  );
};
