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

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const data = await developerAuthService.obtenerPerfil();
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
    } catch {
      setUser(null);
      setDesarrollador(null);
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
      setUser(data.data.user);
      setDesarrollador(data.data.desarrollador);
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
        isAuthenticated: !!desarrollador,
        esDesarrollador: !!desarrollador,
      }}
    >
      {children}
    </DeveloperAuthContext.Provider>
  );
};
