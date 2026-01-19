/**
 * Provider de Autenticación para Desarrolladores (Steamworks)
 * Maneja el estado de sesión del desarrollador
 */

import { useState, useEffect } from 'react';
import { developerAuthService } from '../services/developerAuthService';
import { DeveloperAuthContext } from './context';

export const DeveloperAuthProvider = ({ children }) => {
  const [desarrollador, setDesarrollador] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [hadSession, setHadSession] = useState(false);

  useEffect(() => {
    verificarSesion();
  }, []);
  useEffect(() => {
    if (!desarrollador) return;

    const intervalId = setInterval(async () => {
      try {
        await developerAuthService.validateSession();
      } catch {
        setUser(null);
        setDesarrollador(null);
        if (hadSession) {
          setSessionExpired(true);
        }
        setHadSession(false);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [desarrollador, hadSession]);


  const verificarSesion = async () => {
    try {
      await developerAuthService.validateSession();
      const data = await developerAuthService.obtenerPerfil();
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
      setHadSession(true);
      setSessionExpired(false);
    } catch {
      setUser(null);
      setDesarrollador(null);
      if (hadSession) {
        setSessionExpired(true);
      }
      setHadSession(false);
    } finally {
      setLoading(false);
    }
  };

  const registrar = async (datosRegistro) => {
    try {
      setError(null);
      const data = await developerAuthService.registrar(datosRegistro);
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await developerAuthService.login(email, password);
      const requiresMFA = data.requiresMFA || data.data?.mfaRequired;
      if (requiresMFA) {
        return data;
      }
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
      setHadSession(true);
      setSessionExpired(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await developerAuthService.logout();
      setUser(null);
      setDesarrollador(null);
      setHadSession(false);
      setSessionExpired(false);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const refreshDesarrollador = async () => {
    try {
      const data = await developerAuthService.obtenerPerfil();
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
      setHadSession(true);
      return data;
    } catch (err) {
      console.error('Error al refrescar desarrollador:', err);
      throw err;
    }
  };

  return (
    <DeveloperAuthContext.Provider
      value={{
        user,
        desarrollador,
        loading,
        error,
        registrar,
        login,
        logout,
        refreshDesarrollador,
        sessionExpired,
        isAuthenticated: !!desarrollador,
        esDesarrollador: !!desarrollador,
      }}
    >
      {children}
    </DeveloperAuthContext.Provider>
  );
};
