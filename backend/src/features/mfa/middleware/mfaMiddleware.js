/**
 * Middleware genérico para MFA
 * Puede ser usado por cualquier tipo de usuario
 */

import { getUserTypeConfig, isValidUserType } from '../config/userTypes.js';

const mfaMiddleware = {
  /**
   * Middleware para agregar el tipo de usuario al request
   * Debe ser usado después del middleware de autenticación específico
   */
  setUserType: (userType) => {
    return (req, res, next) => {
      if (!isValidUserType(userType)) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de tipo de usuario inválida'
        });
      }
      
      req.user = req.user || {};
      req.user.userType = userType;
      next();
    };
  },

  /**
   * Middleware para extraer el tipo de usuario del body o query
   * Útil para endpoints públicos de login
   */
  extractUserType: (req, res, next) => {
    const userType = req.body.userType || req.query.userType || 'admin';
    
    if (!isValidUserType(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de usuario inválido'
      });
    }
    
    req.userType = userType;
    next();
  }
};

export default mfaMiddleware;
