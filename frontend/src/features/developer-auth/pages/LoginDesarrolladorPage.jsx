/**
 * Página de Login para Desarrolladores (Steamworks)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginDesarrolladorForm } from '../components/LoginDesarrolladorForm';
import { MFAVerificationModal } from '../components/MFAVerificationModal';
import { developerAuthService } from '../services/developerAuthService';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const LoginDesarrolladorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, error, refreshDesarrollador, logout } = useDeveloperAuth();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showSessionExpiredMessage, setShowSessionExpiredMessage] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);

  // Verificar si viene de verificacion exitosa
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShowVerificationMessage(true);
      // Limpiar el parametro despues de 5 segundos
      setTimeout(() => setShowVerificationMessage(false), 5000);
    }

    if (searchParams.get('session') === 'expired') {
      setShowSessionExpiredMessage(true);
      setTimeout(() => setShowSessionExpiredMessage(false), 5000);
    }
  }, [searchParams]);

  const handleLogin = async (email, password) => {
    try {
      const result = await login(email, password);
      const requiresMFA = result?.requiresMFA || result?.data?.mfaRequired;

      if (requiresMFA) {
        setShowMFAVerification(true);
        return;
      }

      navigate('/steamworks/dashboard');
    } catch (err) {
      // Error manejado por el contexto
      console.error('Error en login:', err);
    }
  };

  const handleMFAVerified = async (codigo) => {
    await developerAuthService.verifyMFALogin(codigo);
    await refreshDesarrollador();
    setShowMFAVerification(false);
    navigate('/steamworks/dashboard');
  };

  const handleMFACancel = async () => {
    setShowMFAVerification(false);
    try {
      await logout();
    } catch (err) {
      console.error('Error en logout:', err);
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
      {showSessionExpiredMessage && (
        <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4'>
          <div className='bg-yellow-900/90 border border-yellow-500 text-yellow-100 px-6 py-4 rounded-lg shadow-lg'>
            <div className='flex items-center'>
              <svg
                className='w-6 h-6 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <div>
                <p className='font-semibold'>Sesion expirada</p>
                <p className='text-sm'>Vuelve a iniciar sesion para continuar</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <LoginDesarrolladorForm
        onSubmit={handleLogin}
        error={error}
      />

      <MFAVerificationModal
        isOpen={showMFAVerification}
        onClose={handleMFACancel}
        onVerify={handleMFAVerified}
        title='Verificacion MFA - Inicio de sesion'
      />
    </>
  );
};
