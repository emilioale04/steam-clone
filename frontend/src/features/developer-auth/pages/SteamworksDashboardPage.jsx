/**
 * Dashboard principal de Steamworks con navegación por tabs
 * Contiene el navbar y renderiza contenido según el tab activo
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeveloperAuth } from '../hooks/useDeveloperAuth';
import { NavbarSteamworks } from '../components/NavbarSteamworks';
import { GestionLlavesPage } from '../../game-keys/pages/GestionLlavesPage';

export const SteamworksDashboardPage = () => {
  const navigate = useNavigate();
  const { desarrollador, logout } = useDeveloperAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <div className='p-8'>
            <h2 className='text-3xl font-bold text-white mb-6'>
              Mis Aplicaciones
            </h2>
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 text-center'>
              <p className='text-gray-400'>No tienes aplicaciones aún</p>
            </div>
          </div>
        );

      case 'gestion-claves':
        return (
          <div className='max-w-7xl mx-auto px-4 py-8'>
            <GestionLlavesPage mostrarHeader={false} />
          </div>
        );

      case 'mi-perfil':
        const profileEditable = canEditProfile();
        const daysRemaining = getDaysUntilEdit();

        return (
          <div className='max-w-4xl mx-auto px-4 py-8'>
            <h2 className='text-3xl font-bold text-white mb-6'>Mi Perfil</h2>

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
                    defaultValue={desarrollador?.nombre_legal}
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
                    defaultValue={desarrollador?.telefono || ''}
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
                    disabled={!profileEditable}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      profileEditable
                        ? 'bg-[#66c0f4] text-white hover:bg-[#5bb1e3]'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Guardar Cambios
                  </button>
                  <p className='text-xs text-yellow-400 mt-2'>
                    ⚠️ Se requiere verificación MFA para guardar cambios en el
                    perfil
                  </p>
                </div>
              </div>
            </div>

            {/* Sección B: Información Bancaria */}
            <div className='bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6'>
              <h3 className='text-xl font-semibold text-white mb-4 border-b border-[#2a3f5f] pb-3'>
                Información Bancaria
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-400 mb-2'>
                    Banco
                  </label>
                  <select
                    defaultValue='Banco Pichincha'
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
                    defaultValue={desarrollador?.nombre_legal}
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
                    disabled={!profileEditable}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      profileEditable
                        ? 'bg-[#66c0f4] text-white hover:bg-[#5bb1e3]'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Guardar Cambios
                  </button>
                  <p className='text-xs text-yellow-400 mt-2'>
                    ⚠️ Se requiere verificación MFA para guardar cambios
                    bancarios
                  </p>
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
    </div>
  );
};
