import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import ResumenPanel from '../components/ResumenPanel';
import BloqueoPais from '../components/BloqueoPais';
import RevisionJuegos from '../components/RevisionJuegos';
import GestionUsuarios from '../components/GestionUsuarios';
import GestionCategorias from '../components/GestionCategorias';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/steamworks/admin-login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen del Panel' },
    { id: 'bloqueo', label: 'Bloqueo por País' },
    { id: 'revision', label: 'Revisión de Juegos' },
    { id: 'usuarios', label: 'Gestión de Usuarios' },
    { id: 'categorias', label: 'Gestión de Categorías' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenPanel />;
      case 'bloqueo':
        return <BloqueoPais />;
      case 'revision':
        return <RevisionJuegos />;
      case 'usuarios':
        return <GestionUsuarios />;
      case 'categorias':
        return <GestionCategorias />;
      default:
        return <ResumenPanel />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1b2838' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#171a21',
        padding: '1rem 2rem',
        borderBottom: '1px solid #2a475e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: '#66c0f4', margin: 0, fontSize: '1.5rem' }}>
            Steamworks Admin
          </h1>
          <p style={{ color: '#8f98a0', margin: 0, fontSize: '0.875rem' }}>
            Panel de Administración
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#c7d5e0' }}>
            {admin?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        backgroundColor: '#2a475e',
        padding: '0 2rem',
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #1b2838'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === tab.id ? '#1b2838' : 'transparent',
              color: activeTab === tab.id ? '#66c0f4' : '#8f98a0',
              border: 'none',
              borderTop: activeTab === tab.id ? '2px solid #66c0f4' : 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
