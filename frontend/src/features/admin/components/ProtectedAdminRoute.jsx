import { Navigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';

const ProtectedAdminRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Verificando permisos...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/steamworks/admin-login" replace />;
  }

  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1b2838',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #2a475e',
    borderTop: '4px solid #66c0f4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#8f98a0',
    marginTop: '20px',
    fontSize: '14px',
  },
};

export default ProtectedAdminRoute;
