/**
 * Formulario de Login para Desarrolladores (Steamworks)
 * Diseño oscuro estilo Steam con branding de Steamworks
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { developerAuthService } from '../services/developerAuthService';

export const LoginDesarrolladorForm = ({ onSubmit, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [reenviandoCorreo, setReenviandoCorreo] = useState(false);
  const [correoReenviado, setCorreoReenviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);
    setCorreoReenviado(false);
    try {
      await onSubmit(email, password);
    } catch (err) {
      // Detectar si es error de email no verificado
      if (err.message && err.message.includes('verificar tu correo')) {
        setEmailNotVerified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCorreo = async () => {
    setReenviandoCorreo(true);
    setCorreoReenviado(false);
    try {
      await developerAuthService.reenviarVerificacion(email);
      setCorreoReenviado(true);
    } catch (err) {
      console.error('Error al reenviar correo:', err);
    } finally {
      setReenviandoCorreo(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Header Steamworks */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>
            <span className='text-[#66c0f4]'>Steam</span>works
          </h1>
          <p className='text-gray-400 text-sm'>Portal de Desarrolladores</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className='bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]'
        >
          <h2 className='text-xl font-semibold text-white mb-6 text-center'>
            Iniciar Sesión como Desarrollador
          </h2>

          {error && !emailNotVerified && (
            <div className='bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm'>
              {error}
            </div>
          )}

          {emailNotVerified && (
            <div className='bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded mb-4 text-sm'>
              <div className='flex items-start'>
                <svg
                  className='w-5 h-5 mr-2 mt-0.5 flex-shrink-0'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <div className='flex-1'>
                  <p className='font-semibold mb-1'>Email no verificado</p>
                  <p className='text-xs'>
                    Debes verificar tu correo electrónico antes de iniciar
                    sesión. Revisa tu bandeja de entrada o solicita un nuevo
                    correo de verificación.
                  </p>
                  {!correoReenviado ? (
                    <button
                      type='button'
                      onClick={handleReenviarCorreo}
                      disabled={reenviandoCorreo || !email}
                      className='mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                      {reenviandoCorreo
                        ? 'Enviando...'
                        : 'Reenviar correo de verificación'}
                    </button>
                  ) : (
                    <div className='mt-3 bg-green-900/50 border border-green-500 text-green-200 px-3 py-2 rounded text-xs'>
                      ✓ Correo reenviado exitosamente. Revisa tu bandeja de
                      entrada.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-gray-300 text-sm mb-2'
              >
                Correo Electrónico
              </label>
              <input
                id='email'
                type='email'
                placeholder='tu@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] transition-colors'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-gray-300 text-sm mb-2'
              >
                Contraseña
              </label>
              <input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] transition-colors'
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 bg-gradient-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className='mt-6 text-center space-y-3'>
            <Link
              to='/steamworks/forgot-password'
              className='text-[#66c0f4] hover:text-[#8ad0f8] text-sm block'
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <div className='text-gray-400 text-sm'>
              ¿No tienes cuenta de desarrollador?{' '}
              <Link
                to='/steamworks/registro'
                className='text-[#66c0f4] hover:text-[#8ad0f8] font-medium'
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className='mt-6 text-center text-gray-500 text-xs'>
          <p>© 2026 Steam Clone - Componente Steamworks</p>
          <p className='mt-1'>
            <Link
              to='/'
              className='text-[#66c0f4] hover:underline'
            >
              Volver a Steam
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
