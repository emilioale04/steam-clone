/**
 * Página de Registro para Desarrolladores (Steamworks)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterDesarrolladorForm } from '../components/RegisterDesarrolladorForm';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';

export const RegisterDesarrolladorPage = () => {
  const navigate = useNavigate();
  const { registrar, error } = useDeveloperAuth();
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState('');

  const handleRegister = async (datosRegistro) => {
    try {
      const resultado = await registrar(datosRegistro);
      if (resultado && resultado.data) {
        setEmailRegistrado(datosRegistro.email);
        setRegistroExitoso(true);
        // No redirigir automáticamente, mostrar mensaje de verificación
      }
    } catch (err) {
      // Error manejado por el contexto
      console.error('Error en registro:', err);
    }
  };

  if (registroExitoso) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]'>
            <div className='text-center mb-6'>
              <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-green-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-white mb-2'>
                ¡Registro Exitoso!
              </h2>
              <p className='text-gray-400'>
                Tu cuenta de desarrollador ha sido creada
              </p>
            </div>

            <div className='bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6'>
              <h3 className='text-blue-300 font-semibold mb-2 flex items-center'>
                <svg
                  className='w-5 h-5 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                  <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                </svg>
                Verifica tu correo electrónico
              </h3>
              <p className='text-gray-300 text-sm'>
                Hemos enviado un correo de verificación a:
              </p>
              <p className='text-white font-mono text-sm mt-2 bg-[#2a3f5f] px-3 py-2 rounded'>
                {emailRegistrado}
              </p>
              <p className='text-gray-400 text-sm mt-3'>
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace
                de verificación para activar tu cuenta.
              </p>
            </div>

            <div className='space-y-3'>
              <button
                onClick={() => navigate('/steamworks/login')}
                className='w-full py-3 bg-gradient-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all'
              >
                Ir a Inicio de Sesión
              </button>
            </div>

            <div className='mt-4 text-center text-gray-400 text-xs'>
              <p>
                Si no recibes el correo en unos minutos, revisa tu carpeta de
                spam
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegisterDesarrolladorForm
      onSubmit={handleRegister}
      error={error}
    />
  );
};
