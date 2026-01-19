/**
 * Dashboard principal de Steamworks con navegación por tabs
 * Contiene el navbar y renderiza contenido según el tab activo
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';
import { NavbarSteamworks } from '../components/NavbarSteamworks';
import { GestionLlavesPage } from '../../game-keys/pages/GestionLlavesPage';
import { MFASetupModal } from '../components/MFASetupModal';
import { MFAVerificationModal } from '../components/MFAVerificationModal';
import { developerProfileService } from '../services/developerProfileService';
import { NuevaAppPage } from '../../new-app/pages';
import { MisAplicacionesPage } from '../../my-apps';
import { AppItemsPage } from '../../app-items/pages/AppItemsPage';

export const SteamworksDashboardPage = () => {
  const navigate = useNavigate();
  const { desarrollador, logout, refreshDesarrollador } = useDeveloperAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados para MFA
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [estadoMFA, setEstadoMFA] = useState(null);

  // Estados para edición de perfil - Información Personal
  const [nombreLegal, setNombreLegal] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estados para edición de perfil - Información Bancaria
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titularCuenta, setTitularCuenta] = useState('');

  // Estados para modal de verificación MFA
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaAction, setMfaAction] = useState(null); // 'personal' | 'bancaria'

  // Estados para feedback
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingBancaria, setLoadingBancaria] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos del perfil cuando cambia el desarrollador
  useEffect(() => {
    if (desarrollador) {
      setNombreLegal(desarrollador.nombre_legal || '');
      setTelefono(desarrollador.telefono || '');
      setBanco(desarrollador.banco || 'Banco Pichincha');
      setNumeroCuenta(desarrollador.numero_cuenta || '');
      setTitularCuenta(
        desarrollador.titular_cuenta || desarrollador.nombre_legal || '',
      );
    }
  }, [desarrollador]);

  // Cargar estado de MFA al montar
  useEffect(() => {
    const cargarEstadoMFA = async () => {
      try {
        const response = await developerProfileService.obtenerEstadoMFA();
        setEstadoMFA(response.data);
      } catch (error) {
        console.error('Error al cargar estado MFA:', error);
      }
    };

    cargarEstadoMFA();
  }, []);

  // RF-003: Validación de 5 días desde última modificación
  const canEditProfile = () => {
    if (!desarrollador?.ultima_modificacion_perfil) {
      return true; // Primera vez, puede editar
    }
    const lastUpdate = new Date(desarrollador.ultima_modificacion_perfil);
    const now = new Date();
    const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    return diffDays >= 5;
  };

  const getDaysUntilEdit = () => {
    if (!desarrollador?.ultima_modificacion_perfil) return 0;
    const lastUpdate = new Date(desarrollador.ultima_modificacion_perfil);
    const now = new Date();
    const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    return Math.max(0, 5 - diffDays);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/steamworks/login');
    } catch (err) {
      console.error('Error en logout:', err);
    }
  };

  // Función para iniciar guardado de información personal
  const handleGuardarPersonal = () => {
    if (!canEditProfile()) {
      setErrorMessage(
        `Debes esperar ${getDaysUntilEdit()} días para editar tu perfil nuevamente`,
      );
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (!estadoMFA?.mfaEnabled) {
      setErrorMessage('Debes habilitar MFA antes de editar tu perfil');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setMfaAction('personal');
    setShowMFAVerification(true);
  };

  // Función para iniciar guardado de información bancaria
  const handleGuardarBancaria = () => {
    if (!canEditProfile()) {
      setErrorMessage(
        `Debes esperar ${getDaysUntilEdit()} días para editar tu perfil nuevamente`,
      );
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (!estadoMFA?.mfaEnabled) {
      setErrorMessage(
        'Debes habilitar MFA antes de editar información bancaria',
      );
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setMfaAction('bancaria');
    setShowMFAVerification(true);
  };

  // Función que se ejecuta después de verificar MFA
  const handleMFAVerified = async (codigoMFA) => {
    try {
      if (mfaAction === 'personal') {
        setLoadingPersonal(true);
        const response =
          await developerProfileService.actualizarInformacionPersonal(
            nombreLegal,
            telefono,
            codigoMFA,
          );
        setSuccessMessage(
          response.mensaje || 'Información personal actualizada correctamente',
        );
        await refreshDesarrollador(); // Recargar datos del desarrollador
      } else if (mfaAction === 'bancaria') {
        setLoadingBancaria(true);
        const response =
          await developerProfileService.actualizarInformacionBancaria(
            banco,
            numeroCuenta,
            titularCuenta,
            codigoMFA,
          );
        setSuccessMessage(
          response.mensaje || 'Información bancaria actualizada correctamente',
        );
        await refreshDesarrollador(); // Recargar datos del desarrollador
      }

      setShowMFAVerification(false);
      setMfaAction(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage(error.message || 'Error al actualizar la información');
      setTimeout(() => setErrorMessage(''), 5000);
      throw error; // Re-lanzar para que el modal muestre el error
    } finally {
      setLoadingPersonal(false);
      setLoadingBancaria(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className='max-w-7xl mx-auto px-4 py-8'>
            <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6 mb-6'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                ¡Bienvenido a Steamworks!
              </h2>
              <p className='text-gray-400'>
                Has iniciado sesión como desarrollador. Desde aquí podrás
                gestionar tus aplicaciones, configurar tu tienda y administrar
                tus ventas.
              </p>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6'>
                <h3 className='text-gray-400 text-sm mb-2'>Mis Aplicaciones</h3>
                <p className='text-3xl font-bold text-[#66c0f4]'>0</p>
              </div>
              <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6'>
                <h3 className='text-gray-400 text-sm mb-2'>En Revisión</h3>
                <p className='text-3xl font-bold text-yellow-400'>0</p>
              </div>
              <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6'>
                <h3 className='text-gray-400 text-sm mb-2'>Publicados</h3>
                <p className='text-3xl font-bold text-green-400'>0</p>
              </div>
            </div>

            {/* Actions */}
            <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6 mb-6'>
              <h3 className='text-lg font-semibold text-white mb-4'>
                Acciones Rápidas
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <button
                  onClick={() => setActiveTab('gestion-claves')}
                  className='p-4 bg-[#2a3f5f] rounded border border-[#3d5a80] text-left hover:border-[#66c0f4] transition-colors'
                >
                  <span className='text-[#66c0f4] font-medium block mb-1'>
                    Gestión de Llaves
                  </span>
                  <span className='text-gray-400 text-sm'>
                    Genera y administra llaves de activación para tus juegos
                  </span>
                </button>
                <button className='p-4 bg-[#2a3f5f] rounded border border-[#3d5a80] text-left hover:border-[#66c0f4] transition-colors'>
                  <span className='text-[#66c0f4] font-medium block mb-1'>
                    + Nueva Aplicación
                  </span>
                  <span className='text-gray-400 text-sm'>
                    Registra un nuevo juego (requiere pago de $100 USD)
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('mi-perfil')}
                  className='p-4 bg-[#2a3f5f] rounded border border-[#3d5a80] text-left hover:border-[#66c0f4] transition-colors'
                >
                  <span className='text-[#66c0f4] font-medium block mb-1'>
                    Editar Perfil
                  </span>
                  <span className='text-gray-400 text-sm'>
                    Actualiza tu información personal y bancaria
                  </span>
                </button>
              </div>
            </div>

            {/* Developer Info */}
            <div className='bg-[#1e2a38] rounded-lg border border-[#2a3f5f] p-6'>
              <h3 className='text-lg font-semibold text-white mb-4'>
                Información del Desarrollador
              </h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-400'>Nombre:</span>
                  <span className='text-white ml-2'>
                    {desarrollador?.nombre_legal}
                  </span>
                </div>
                <div>
                  <span className='text-gray-400'>País:</span>
                  <span className='text-white ml-2'>{desarrollador?.pais}</span>
                </div>
                <div>
                  <span className='text-gray-400'>Rol:</span>
                  <span className='text-white ml-2'>{desarrollador?.rol}</span>
                </div>
                <div>
                  <span className='text-gray-400'>MFA:</span>
                  <span
                    className={`ml-2 ${desarrollador?.mfa_habilitado ? 'text-green-400' : 'text-yellow-400'}`}
                  >
                    {desarrollador?.mfa_habilitado ? 'Activado' : 'No activado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mis-aplicaciones':
        return (
          <MisAplicacionesPage 
            onEditStore={(app) => {
              // Navegar a configuración de tienda con la aplicación seleccionada
              console.log('[DASHBOARD] Editar tienda de:', app.app_id);
              setActiveTab('configuracion-tienda');
              // TODO: Pasar el app seleccionado al tab de configuración de tienda
            }}
          />
        );

      case 'nueva-aplicacion':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Agregar una nueva aplicación</h2>
            <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 text-center">
              <NuevaAppPage />
            </div>
          </div>
        );

      case 'gestion-claves':
        return (
          <div className='max-w-7xl mx-auto px-4 py-8'>
            <GestionLlavesPage mostrarHeader={false} />
          </div>
        );

      case 'objetos-marketplace':
        return (
          <div className='max-w-7xl mx-auto px-4 py-8'>
            <AppItemsPage />
          </div>
        );

      case 'mi-perfil':
        const profileEditable = canEditProfile();
        const daysRemaining = getDaysUntilEdit();

        return (
          <div className='max-w-4xl mx-auto px-4 py-8'>
            <h2 className='text-3xl font-bold text-white mb-6'>Mi Perfil</h2>

            {/* Mensajes de feedback */}
            {successMessage && (
              <div className='bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6'>
                <p className='text-green-400 flex items-center'>
                  <span className='mr-2'>✓</span>
                  {successMessage}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className='bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6'>
                <p className='text-red-400 flex items-center'>
                  <span className='mr-2'>✗</span>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Alerta de restricción de 5 días (RF-003) */}
            {!profileEditable && (
              <div className='bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6'>
                <div className='flex items-start'>
                  <span className='text-yellow-400 text-2xl mr-3'>⚠️</span>
                  <div>
                    <h4 className='text-yellow-400 font-semibold mb-1'>
                      Perfil bloqueado temporalmente
                    </h4>
                    <p className='text-gray-300 text-sm'>
                      Por seguridad (RF-003), solo puedes editar tu perfil cada
                      5 días. Podrás editar nuevamente en{' '}
                      <strong>
                        {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sección A: Información Personal */}
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 mb-6'>
              <h3 className='text-xl font-semibold text-white mb-4 border-b border-[#2a3f5f] pb-3'>
                Información Personal
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Nombre Completo
                  </label>
                  <input
                    type='text'
                    value={nombreLegal}
                    onChange={(e) => setNombreLegal(e.target.value)}
                    disabled={!profileEditable}
                    className={`w-full bg-[#0f1923] text-white px-4 py-2 rounded border ${
                      profileEditable
                        ? 'border-[#2a3f5f] focus:border-[#66c0f4]'
                        : 'border-gray-700 cursor-not-allowed opacity-60'
                    } focus:outline-none`}
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Email
                    <span className='ml-2 text-xs text-gray-500'>
                      (Solo lectura)
                    </span>
                  </label>
                  <input
                    type='email'
                    value={desarrollador?.email || ''}
                    readOnly
                    className='w-full bg-[#0f1923] text-gray-400 px-4 py-2 rounded border border-gray-700 cursor-not-allowed opacity-60'
                    title='El email no puede ser modificado por seguridad'
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Teléfono
                  </label>
                  <input
                    type='tel'
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder='Ej: +593 99 999 9999'
                    disabled={!profileEditable}
                    className={`w-full bg-[#0f1923] text-white px-4 py-2 rounded border ${
                      profileEditable
                        ? 'border-[#2a3f5f] focus:border-[#66c0f4]'
                        : 'border-gray-700 cursor-not-allowed opacity-60'
                    } focus:outline-none`}
                  />
                </div>
                <div className='pt-4'>
                  <button
                    onClick={handleGuardarPersonal}
                    disabled={!profileEditable || loadingPersonal}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      profileEditable && !loadingPersonal
                        ? 'bg-[#66c0f4] text-white hover:bg-[#5bb1e3]'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingPersonal ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <p className='text-xs text-yellow-400 mt-2'>
                    ⚠️ Se requiere verificación MFA para guardar cambios en el
                    perfil
                  </p>
                </div>
              </div>
            </div>

            {/* Sección B: Información Bancaria */}
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 mb-6'>
              <h3 className='text-xl font-semibold text-white mb-4 border-b border-[#2a3f5f] pb-3'>
                Información Bancaria
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Banco
                  </label>
                  <select
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    disabled={!profileEditable}
                    className={`w-full bg-[#0f1923] text-white px-4 py-2 rounded border ${
                      profileEditable
                        ? 'border-[#2a3f5f] focus:border-[#66c0f4]'
                        : 'border-gray-700 cursor-not-allowed opacity-60'
                    } focus:outline-none`}
                  >
                    <option value='Banco Pichincha'>Banco Pichincha</option>
                    <option value='Banco Guayaquil'>Banco Guayaquil</option>
                    <option value='Banco Pacífico'>Banco Pacífico</option>
                    <option value='Produbanco'>Produbanco</option>
                    <option value='Banco del Austro'>Banco del Austro</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Número de Cuenta
                  </label>
                  <input
                    type='text'
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    placeholder='Ej: 2100123456'
                    disabled={!profileEditable}
                    className={`w-full bg-[#0f1923] text-white px-4 py-2 rounded border ${
                      profileEditable
                        ? 'border-[#2a3f5f] focus:border-[#66c0f4]'
                        : 'border-gray-700 cursor-not-allowed opacity-60'
                    } focus:outline-none`}
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Nombre del Titular
                  </label>
                  <input
                    type='text'
                    value={titularCuenta}
                    onChange={(e) => setTitularCuenta(e.target.value)}
                    disabled={!profileEditable}
                    className={`w-full bg-[#0f1923] text-white px-4 py-2 rounded border ${
                      profileEditable
                        ? 'border-[#2a3f5f] focus:border-[#66c0f4]'
                        : 'border-gray-700 cursor-not-allowed opacity-60'
                    } focus:outline-none`}
                  />
                </div>
                <div className='pt-4'>
                  <button
                    onClick={handleGuardarBancaria}
                    disabled={!profileEditable || loadingBancaria}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      profileEditable && !loadingBancaria
                        ? 'bg-[#66c0f4] text-white hover:bg-[#5bb1e3]'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingBancaria ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <p className='text-xs text-yellow-400 mt-2'>
                    ⚠️ Se requiere verificación MFA para guardar cambios
                    bancarios
                  </p>
                </div>
              </div>
            </div>

            {/* Sección C: Seguridad (MFA) */}
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6'>
              <h3 className='text-xl font-semibold text-white mb-4 flex items-center'>
                <span className='mr-3 text-[#66c0f4]'>🔒</span>
                Seguridad
              </h3>
              <div className='space-y-4'>
                <div className='bg-[#0f1923] p-4 rounded-lg border border-[#2a3f5f]'>
                  <h4 className='text-white font-medium mb-2 flex items-center'>
                    Autenticación de Múltiples Factores (MFA)
                    {estadoMFA?.mfa_habilitado && (
                      <span className='ml-2 px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-600'>
                        ✓ Activado
                      </span>
                    )}
                  </h4>
                  <p className='text-gray-400 text-sm mb-4'>
                    {estadoMFA?.mfa_habilitado
                      ? 'Tu cuenta está protegida con autenticación de dos factores usando Microsoft Authenticator.'
                      : 'Protege tu cuenta agregando una capa adicional de seguridad con Microsoft Authenticator.'}
                  </p>

                  {!estadoMFA?.mfa_habilitado && (
                    <div className='bg-yellow-900/20 border border-yellow-600/40 rounded p-3 mb-4'>
                      <p className='text-yellow-400 text-sm flex items-center'>
                        <span className='mr-2'>⚠️</span>
                        <span>
                          Se recomienda habilitar MFA para proteger tu cuenta y
                          tus aplicaciones.
                        </span>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowMFASetup(true)}
                    className='px-4 py-2 bg-[#66c0f4] text-white rounded hover:bg-[#5bb1e3] transition-colors font-medium'
                  >
                    {estadoMFA?.mfa_habilitado
                      ? 'Gestionar MFA'
                      : 'Configurar MFA'}
                  </button>
                </div>

                <div className='bg-[#0f1923] p-4 rounded-lg border border-[#2a3f5f]'>
                  <h4 className='text-white font-medium mb-2'>
                    Aplicaciones Compatibles
                  </h4>
                  <p className='text-gray-400 text-sm mb-3'>
                    Puedes usar cualquiera de estas aplicaciones para generar
                    códigos de verificación:
                  </p>
                  <ul className='text-sm text-gray-300 space-y-1 list-disc list-inside'>
                    <li>Microsoft Authenticator (Recomendado)</li>
                    <li>Google Authenticator</li>
                    <li>Authy</li>
                    <li>Cualquier aplicación TOTP compatible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='p-8'>
            <h2 className='text-3xl font-bold text-white mb-6'>{activeTab}</h2>
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 text-center'>
              <p className='text-gray-400'>Contenido en desarrollo</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]'>
      <NavbarSteamworks
        activeTab={activeTab}
        onTabChange={setActiveTab}
        nombreDesarrollador={desarrollador?.nombre_legal || 'Desarrollador'}
        rolDesarrollador={desarrollador?.rol}
        onLogout={handleLogout}
      />
      <main>{renderContent()}</main>

      {/* Modal de configuración de MFA */}
      {showMFASetup && (
        <MFASetupModal
          onClose={() => setShowMFASetup(false)}
          isOpen={showMFASetup}
          profileMode={true}
          onMFAChange={async () => {
            // Recargar estado de MFA
            try {
              const response = await developerProfileService.obtenerEstadoMFA();
              setEstadoMFA(response.data);
            } catch (error) {
              console.error('Error al recargar estado MFA:', error);
            }
          }}
        />
      )}

      {/* Modal de verificación MFA */}
      {showMFAVerification && (
        <MFAVerificationModal
          isOpen={showMFAVerification}
          onClose={() => {
            setShowMFAVerification(false);
            setMfaAction(null);
          }}
          onVerify={handleMFAVerified}
          title={
            mfaAction === 'personal'
              ? 'Verificación MFA - Información Personal'
              : 'Verificación MFA - Información Bancaria'
          }
        />
      )}
    </div>
  );
};
