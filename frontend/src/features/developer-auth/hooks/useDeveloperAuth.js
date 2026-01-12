/**
 * Hook para usar el contexto de autenticación de desarrolladores
 */

import { useContext } from 'react';
import { DeveloperAuthContext } from '../context/context';

export const useDeveloperAuth = () => {
  const context = useContext(DeveloperAuthContext);
  if (!context) {
    throw new Error('useDeveloperAuth debe usarse dentro de DeveloperAuthProvider');
  }
  return context;
};
