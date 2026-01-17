import { useState, useEffect } from 'react';
import { AdminAuthContext } from './context';
import adminAuthService from '../services/adminAuthService';

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (adminAuthService.isAuthenticated()) {
          const currentUser = adminAuthService.getCurrentUser();
          setAdmin(currentUser);
          
          await adminAuthService.validateSession();
        }
      } catch (error) {
        console.error('Error al validar sesión:', error);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const data = await adminAuthService.login(email, password);
      setAdmin(data.user);
      return data;
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminAuthService.logout();
      setAdmin(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const updateAdmin = (userData) => {
    setAdmin(userData);
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    updateAdmin,
    isAuthenticated: !!admin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;
