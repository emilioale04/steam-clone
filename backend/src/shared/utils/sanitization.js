/**
 * Input Sanitization Utilities
 * Grupo 2 - Seguridad Steamworks
 * 
 * Implementa:
 * - C3: Prevención de inyecciones (sanitización de entradas)
 * - Validación y limpieza de datos de entrada
 */

/**
 * Sanitiza una cadena de texto removiendo caracteres peligrosos
 * Previene XSS y SQL injection
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers (onclick=, onerror=, etc.)
}

/**
 * Sanitiza un email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  return email.toLowerCase().trim();
}

/**
 * Lista de campos que NO deben ser sanitizados
 * Incluye contraseñas, tokens y datos sensibles que serán cifrados
 * 
 * IMPORTANTE: La sanitización puede alterar valores válidos en estos campos:
 * - Contraseñas: pueden contener caracteres especiales válidos
 * - Tokens: contienen datos codificados que no deben modificarse
 * - Datos bancarios/fiscales: se cifran después, no deben alterarse antes
 */
const FIELDS_TO_SKIP = [
  'password',
  'oldPassword',
  'newPassword',
  'accessToken',
  'refreshToken',
  'token',
  'nif_cif',           // Dato fiscal sensible (se cifra en el servicio)
  'numero_cuenta',     // Dato bancario sensible (se cifra en el servicio)
  'cuenta_bancaria'    // Dato bancario sensible (se cifra en el servicio)
];

/**
 * Sanitiza un objeto completo recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @param {Array} excludeFields - Campos a excluir de la sanitización
 */
export function sanitizeObject(obj, excludeFields = FIELDS_TO_SKIP) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, excludeFields));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Si el campo está en la lista de exclusión, no sanitizar
      // NOTA: Estos campos requieren preservar su valor exacto:
      // - Passwords: cualquier cambio invalida la contraseña
      // - Tokens: son datos codificados que no deben modificarse
      // - Datos sensibles: se cifran en el servicio, mantienen integridad
      if (excludeFields.includes(key)) {
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, excludeFields);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Valida que una cadena no contenga SQL keywords peligrosos
 */
export function containsSQLInjection(input) {
  if (typeof input !== 'string') return false;
  
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'DECLARE', '--', '/*', '*/', 'xp_',
    'sp_', 'SCRIPT', 'IFRAME'
  ];

  const upperInput = input.toUpperCase();
  
  return sqlKeywords.some(keyword => upperInput.includes(keyword));
}

/**
 * Valida formato de email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida contraseña segura
 * - Mínimo 8 caracteres
 * - Al menos una letra
 * - Al menos un número
 */
export function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return false;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
}

/**
 * Limita la longitud de una cadena
 */
export function limitLength(str, maxLength = 255) {
  if (typeof str !== 'string') return str;
  return str.substring(0, maxLength);
}

/**
 * Valida que un string solo contenga caracteres alfanuméricos y algunos especiales permitidos
 */
export function isAlphanumericSafe(input, allowSpaces = false) {
  if (typeof input !== 'string') return false;
  
  const pattern = allowSpaces 
    ? /^[a-zA-Z0-9\s_-]+$/
    : /^[a-zA-Z0-9_-]+$/;
  
  return pattern.test(input);
}

/**
 * Middleware para sanitizar el body de las requests
 */
export function sanitizeBodyMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}
