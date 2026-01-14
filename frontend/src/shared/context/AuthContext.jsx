import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../../features/auth/services/authService';

const AuthContext = createContext(null);

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
      setUser(data.data);
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

  const clearEmailVerificationPending = () => {
    setEmailVerificationPending(false);
    setPendingEmail(null);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      // Token is now stored in httpOnly cookie by backend (not accessible via JS)
      setUser(data.data.user);
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      emailVerificationPending,
      pendingEmail,
      register,
      login,
      logout,
      clearEmailVerificationPending,
      isAuthenticated: !!user
    }}>
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
