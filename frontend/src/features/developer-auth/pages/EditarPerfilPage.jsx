/**
 * Página de Edición de Perfil de Desarrollador
 * Implementa RF-003: Actualización de información personal y bancaria
 *
 * Características:
 * - Sección de información personal (nombre, email, teléfono)
 * - Sección de información bancaria (banco, cuenta, titular) con cifrado
 * - Verificación MFA requerida para ambas secciones
 * - Validación de restricción de 5 días entre modificaciones
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { developerProfileService } from '../services/developerProfileService';
import { MFAVerificationModal } from '../components/MFAVerificationModal';

export const EditarPerfilPage = () => {
  const navigate = useNavigate();

  // Estados para datos del perfil
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);

  // Estados para información personal
  const [nombreLegal, setNombreLegal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [errorPersonal, setErrorPersonal] = useState('');
  const [successPersonal, setSuccessPersonal] = useState('');

  // Estados para información bancaria
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titularCuenta, setTitularCuenta] = useState('');
  const [loadingBancaria, setLoadingBancaria] = useState(false);
  const [errorBancaria, setErrorBancaria] = useState('');
  const [successBancaria, setSuccessBancaria] = useState('');

  // Estados para MFA
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaAction, setMfaAction] = useState(null); // 'personal' | 'bancaria'

  // Cargar perfil al montar
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await developerProfileService.obtenerPerfilCompleto();

      const { informacionPersonal, informacionBancaria, metadatos } =
        response.data;

      setPerfil(response.data);

      // Cargar información personal
      setNombreLegal(informacionPersonal.nombre_legal || '');
      setTelefono(informacionPersonal.telefono || '');

      // Cargar información bancaria
      setBanco(informacionBancaria.banco || '');
      setNumeroCuenta(informacionBancaria.numero_cuenta || '');
      setTitularCuenta(informacionBancaria.titular_cuenta || '');
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      alert('Error al cargar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar actualización de información personal
  const handleSubmitPersonal = (e) => {
    e.preventDefault();
    setErrorPersonal('');
    setSuccessPersonal('');

    if (!nombreLegal || !telefono) {
      setErrorPersonal('Todos los campos son requeridos');
      return;
    }

    setMfaAction('personal');
    setShowMFAModal(true);
  };

  // Ejecutar actualización personal después de verificar MFA
  const ejecutarActualizacionPersonal = async (codigoMFA) => {
    try {
      setLoadingPersonal(true);
      await developerProfileService.actualizarInformacionPersonal(
        nombreLegal,
        telefono,
        codigoMFA,
      );

      setSuccessPersonal('Información personal actualizada exitosamente');
      await cargarPerfil(); // Recargar perfil

      setTimeout(() => setSuccessPersonal(''), 5000);
    } catch (error) {
      setErrorPersonal(error.message || 'Error al actualizar información');
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Solicitar actualización de información bancaria
  const handleSubmitBancaria = (e) => {
    e.preventDefault();
    setErrorBancaria('');
    setSuccessBancaria('');

    if (!banco || !numeroCuenta || !titularCuenta) {
      setErrorBancaria('Todos los campos son requeridos');
      return;
    }

    setMfaAction('bancaria');
    setShowMFAModal(true);
  };

  // Ejecutar actualización bancaria después de verificar MFA
  const ejecutarActualizacionBancaria = async (codigoMFA) => {
    try {
      setLoadingBancaria(true);
      await developerProfileService.actualizarInformacionBancaria(
        banco,
        numeroCuenta,
        titularCuenta,
        codigoMFA,
      );

      setSuccessBancaria('Información bancaria actualizada exitosamente');
      await cargarPerfil(); // Recargar perfil

      setTimeout(() => setSuccessBancaria(''), 5000);
    } catch (error) {
      setErrorBancaria(
        error.message || 'Error al actualizar información bancaria',
      );
    } finally {
      setLoadingBancaria(false);
    }
  };

  // Manejar verificación MFA
  const handleMFAVerify = async (codigoMFA) => {
    if (mfaAction === 'personal') {
      await ejecutarActualizacionPersonal(codigoMFA);
    } else if (mfaAction === 'bancaria') {
      await ejecutarActualizacionBancaria(codigoMFA);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center'>
        <div className='text-white text-xl'>Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]'>
      {/* Header */}
      <header className='bg-[#1e2a38] border-b border-[#2a3f5f]'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-white'>
            <span className='text-[#66c0f4]'>Steam</span>works - Editar Perfil
          </h1>
          <button
            onClick={() => navigate('/steamworks/dashboard')}
            className='px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors'
          >
            ← Volver al Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 py-8'>
        {/* Información sobre restricción de 2 minutos (MODO PRUEBA) */}
        {perfil?.metadatos?.ultima_actualizacion_datos && (
          <div className='mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded'>
            <p className='text-yellow-400 text-sm'>
              ℹ️ Última modificación:{' '}
              {new Date(
                perfil.metadatos.ultima_actualizacion_datos,
              ).toLocaleString('es-ES')}
              <br />
              ⚠️ MODO PRUEBA: Solo puedes modificar tu información cada 2
              minutos por seguridad.
            </p>
          </div>
        )}

        {/* SECCIÓN A: INFORMACIÓN PERSONAL */}
        <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6 mb-6'>
          <h2 className='text-xl font-semibold text-white mb-4 flex items-center'>
            <span className='text-[#66c0f4] mr-2'>A.</span>
            Información Personal
          </h2>

          <form onSubmit={handleSubmitPersonal}>
            <div className='space-y-4'>
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Nombre Completo *
                </label>
                <input
                  type='text'
                  value={nombreLegal}
                  onChange={(e) => setNombreLegal(e.target.value)}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4]'
                  placeholder='Juan Pérez García'
                  required
                  disabled={loadingPersonal}
                />
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Email
                </label>
                <input
                  type='email'
                  value={perfil?.informacionPersonal?.email || ''}
                  className='w-full px-4 py-2 bg-[#0d1520] text-gray-500 border border-[#2a3f5f] rounded cursor-not-allowed'
                  disabled
                />
                <p className='text-gray-500 text-xs mt-1'>
                  El email no puede ser modificado
                </p>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Teléfono *
                </label>
                <input
                  type='tel'
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4]'
                  placeholder='+593 99 123 4567'
                  required
                  disabled={loadingPersonal}
                />
              </div>
            </div>

            {errorPersonal && (
              <div className='mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded'>
                <p className='text-red-400 text-sm'>{errorPersonal}</p>
              </div>
            )}

            {successPersonal && (
              <div className='mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded'>
                <p className='text-green-400 text-sm'>✓ {successPersonal}</p>
              </div>
            )}

            <button
              type='submit'
              disabled={loadingPersonal}
              className='mt-6 w-full px-4 py-3 bg-[#66c0f4] text-white font-medium rounded hover:bg-[#5ab0e4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loadingPersonal
                ? 'Guardando...'
                : '🔒 Guardar Cambios (Requiere MFA)'}
            </button>
          </form>
        </div>

        {/* SECCIÓN B: INFORMACIÓN BANCARIA */}
        <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6'>
          <h2 className='text-xl font-semibold text-white mb-2 flex items-center'>
            <span className='text-[#66c0f4] mr-2'>B.</span>
            Información Bancaria
          </h2>
          <p className='text-gray-400 text-sm mb-4'>
            🔐 Esta información está protegida con cifrado AES-256
          </p>

          <form onSubmit={handleSubmitBancaria}>
            <div className='space-y-4'>
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Banco *
                </label>
                <input
                  type='text'
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4]'
                  placeholder='Banco Pichincha'
                  required
                  disabled={loadingBancaria}
                />
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Número de Cuenta *
                </label>
                <input
                  type='text'
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4]'
                  placeholder='1234567890'
                  required
                  disabled={loadingBancaria}
                />
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Nombre del Titular *
                </label>
                <input
                  type='text'
                  value={titularCuenta}
                  onChange={(e) => setTitularCuenta(e.target.value)}
                  className='w-full px-4 py-2 bg-[#16213e] text-white border border-[#2a3f5f] rounded focus:outline-none focus:border-[#66c0f4]'
                  placeholder='Juan Pérez García'
                  required
                  disabled={loadingBancaria}
                />
              </div>
            </div>

            {errorBancaria && (
              <div className='mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded'>
                <p className='text-red-400 text-sm'>{errorBancaria}</p>
              </div>
            )}

            {successBancaria && (
              <div className='mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded'>
                <p className='text-green-400 text-sm'>✓ {successBancaria}</p>
              </div>
            )}

            <button
              type='submit'
              disabled={loadingBancaria}
              className='mt-6 w-full px-4 py-3 bg-[#66c0f4] text-white font-medium rounded hover:bg-[#5ab0e4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loadingBancaria
                ? 'Actualizando...'
                : '🔒 Actualizar Información Bancaria (Requiere MFA)'}
            </button>
          </form>
        </div>
      </main>

      {/* Modal de Verificación MFA */}
      <MFAVerificationModal
        isOpen={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setMfaAction(null);
        }}
        onVerify={handleMFAVerify}
        title={
          mfaAction === 'personal'
            ? 'Verificar MFA - Información Personal'
            : 'Verificar MFA - Información Bancaria'
        }
      />
    </div>
  );
};
