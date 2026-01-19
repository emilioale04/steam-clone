/**
 * Configuración de tipos de usuario para MFA
 * Define las tablas y campos correspondientes para cada tipo de usuario
 */

export const USER_TYPES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  USER: 'user',
};

/**
 * Configuración de mapeo entre tipos de usuario y tablas de base de datos
 */
export const USER_TYPE_CONFIG = {
  [USER_TYPES.ADMIN]: {
    table: 'admins',
    displayName: 'Administrador',
    issuerName: 'Steam Clone Admin',
    namePrefix: 'Steam Admin',
  },
  [USER_TYPES.DEVELOPER]: {
    table: 'desarrolladores',
    displayName: 'Desarrollador',
    issuerName: 'Steamworks Developer',
    namePrefix: 'Steamworks',
  },
  [USER_TYPES.USER]: {
    table: 'users',
    displayName: 'Usuario',
    issuerName: 'Steam Clone',
    namePrefix: 'Steam User',
  },
};

/**
 * Valida que el tipo de usuario sea válido
 */
export const isValidUserType = (userType) => {
  return Object.values(USER_TYPES).includes(userType);
};

/**
 * Obtiene la configuración para un tipo de usuario
 */
export const getUserTypeConfig = (userType) => {
  if (!isValidUserType(userType)) {
    throw new Error(`Tipo de usuario inválido: ${userType}`);
  }
  return USER_TYPE_CONFIG[userType];
};

export default {
  USER_TYPES,
  USER_TYPE_CONFIG,
  isValidUserType,
  getUserTypeConfig,
};
