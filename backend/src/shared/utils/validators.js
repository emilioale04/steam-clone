/**
 * Validadores con Expresiones Regulares
 * Grupo 2 - Seguridad Steamworks
 * 
 * Implementa validaciones robustas con Regex para:
 * - Login (Email)
 * - Registro (Email, Username, Password)
 * - Reseñas (Comentarios)
 */

/**
 * Validador de Email
 * Soporta: caracteres alfanuméricos, puntos, guiones, guiones bajos
 * Dominio válido con extensión
 */
export const emailValidator = {
  pattern: /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-zA-Z]{2,}$/,
  test(email) {
    return this.pattern.test(email);
  },
  message: 'Email inválido. Usa un formato válido: ejemplo@dominio.com'
};

/**
 * Validador de Username
 * - 3-32 caracteres
 * - Solo letras, números, guiones y guiones bajos
 * - No puede empezar ni terminar con guion
 */
export const usernameValidator = {
  pattern: /^[a-zA-Z0-9]([a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])?$/,
  minLength: 3,
  maxLength: 32,
  test(username) {
    if (typeof username !== 'string') return false;
    if (username.length < this.minLength || username.length > this.maxLength) return false;
    return this.pattern.test(username);
  },
  message: 'Username debe tener 3-32 caracteres, solo letras, números, guiones y guiones bajos'
};

/**
 * Validador de Contraseña Segura
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial (!@#$%^&*)
 */
export const passwordValidator = {
  minLength: 8,
  maxLength: 128,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_=+\[\]{};:'",.<>?\/\\|`~])[a-zA-Z0-9!@#$%^&*\-_=+\[\]{};:'",.<>?\/\\|`~]{8,}$/,
  test(password) {
    if (typeof password !== 'string') return false;
    if (password.length < this.minLength || password.length > this.maxLength) return false;
    return this.pattern.test(password);
  },
  message: 'Contraseña debe tener: mín 8 caracteres, mayúscula, minúscula, número y carácter especial'
};

/**
 * Validador de Reseña/Comentario
 * - Mínimo 5 caracteres
 * - Máximo 500 caracteres
 * - No contiene HTML/JavaScript
 * - Permite saltos de línea, puntuación y emojis
 */
export const reviewValidator = {
  minLength: 5,
  maxLength: 500,
  // Patrón que rechaza etiquetas HTML y scripts
  dangerousPattern: /<script|<iframe|<embed|<object|javascript:|on\w+\s*=|<\s*\/?\s*\w+/gi,
  test(review) {
    if (typeof review !== 'string') return false;
    if (review.length < this.minLength || review.length > this.maxLength) return false;
    return !this.dangerousPattern.test(review);
  },
  message: 'Reseña debe tener 5-500 caracteres sin HTML ni scripts',
  clean(review) {
    // Eliminar etiquetas HTML y scripts
    let cleaned = review
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
    
    // Limitar a máximo
    return cleaned.substring(0, this.maxLength);
  }
};

/**
 * Validador de búsqueda
 * - 1-100 caracteres
 * - Evita inyecciones SQL simples
 */
export const searchValidator = {
  minLength: 1,
  maxLength: 100,
  // Rechaza palabras clave SQL peligrosas
  sqlKeywordsPattern: /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|--|\*|;)\b)/gi,
  test(query) {
    if (typeof query !== 'string') return false;
    if (query.length < this.minLength || query.length > this.maxLength) return false;
    return !this.sqlKeywordsPattern.test(query);
  },
  message: 'Búsqueda inválida. Evita palabras clave SQL'
};

/**
 * Validador de URL
 * Valida URLs seguras para evitar redirecciones maliciosas
 */
export const urlValidator = {
  pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  test(url) {
    return this.pattern.test(url);
  },
  message: 'URL inválida. Usa http:// o https://'
};

/**
 * Objeto con todos los validadores
 */
export const validators = {
  email: emailValidator,
  username: usernameValidator,
  password: passwordValidator,
  review: reviewValidator,
  search: searchValidator,
  url: urlValidator
};

/**
 * Función auxiliar para validar un campo con su validador
 */
export function validateField(fieldName, value) {
  const validator = validators[fieldName];
  
  if (!validator) {
    throw new Error(`No existe validador para el campo: ${fieldName}`);
  }

  if (!validator.test(value)) {
    return {
      valid: false,
      message: validator.message
    };
  }

  return {
    valid: true,
    value: validator.clean ? validator.clean(value) : value
  };
}

/**
 * Valida múltiples campos de una vez
 */
export function validateFields(fields) {
  const errors = {};
  const validated = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    const result = validateField(fieldName, value);
    
    if (!result.valid) {
      errors[fieldName] = result.message;
    } else {
      validated[fieldName] = result.value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: validated
  };
}
