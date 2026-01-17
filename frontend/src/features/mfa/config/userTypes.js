/**
 * Configuración de tipos de usuario para MFA en el frontend
 * Define las rutas y configuraciones específicas para cada tipo de usuario
 */

export const USER_TYPES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  USER: 'user'
};

/**
 * Configuración de almacenamiento local para cada tipo de usuario
 */
export const USER_TYPE_CONFIG = {
  [USER_TYPES.ADMIN]: {
    tokenKey: 'adminToken',
    refreshTokenKey: 'adminRefreshToken',
    userKey: 'adminUser',
    apiEndpoint: '/admin',
    displayName: 'Administrador'
  },
  [USER_TYPES.DEVELOPER]: {
    tokenKey: 'developerToken',
    refreshTokenKey: 'developerRefreshToken',
    userKey: 'developerUser',
    apiEndpoint: '/developer',
    displayName: 'Desarrollador'
  },
  [USER_TYPES.USER]: {
    tokenKey: 'userToken',
    refreshTokenKey: 'userRefreshToken',
    userKey: 'user',
    apiEndpoint: '/user',
    displayName: 'Usuario'
  }
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
  getUserTypeConfig
};
