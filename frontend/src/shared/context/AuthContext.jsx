import { createContext, useContext, useState, useEffect, useMemo } from 'react';
// import { authService } from '../../features/auth/services/authService';
import { mockAuthService as authService } from '../../features/auth/services/mockAuthService';

const AuthContext = createContext(null);

export const ROLES = {
  LIMITED: 'Limitado',
  STANDARD: 'Estándar',
  FAMILY: 'Familiar',
  DEVELOPER: 'Developer',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      const userData = data.data;
      if (userData && !userData.role) {
        userData.role = ROLES.STANDARD;
      }
      setUser(userData || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, username) => {
    try {
      setError(null);
      const data = await authService.register(email, password, username);
      // User is NOT logged in after registration - email verification required
      if (data.data?.emailVerificationPending) {
        setEmailVerificationPending(true);
        setPendingEmail(data.data.email);
        setUser(null); // Don't set user - not authenticated yet
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      const userData = data.data.user;
      if (!userData.role) userData.role = ROLES.STANDARD;
      setUser(userData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      // Cookie is cleared by backend (httpOnly - not accessible via JS)
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearEmailVerificationPending = () => {
    setEmailVerificationPending(false);
    setPendingEmail(null);
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const debugSetRole = (role) => {
    if (user && Object.values(ROLES).includes(role)) {
      setUser({ ...user, role });
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
    emailVerificationPending,
    pendingEmail,
    register,
    login,
    logout,
    clearEmailVerificationPending,
    isAuthenticated: !!user,
    hasRole,
    debugSetRole,
    ROLES
  }), [user, loading, error, emailVerificationPending, pendingEmail]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
