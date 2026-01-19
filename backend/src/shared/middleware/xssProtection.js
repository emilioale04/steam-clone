/**
 * Middleware XSS Protection
 * Grupo 2 - Seguridad Steamworks
 * 
 * Mitigación de XSS (Cross-Site Scripting) mediante:
 * - Sanitización de inputs
 * - Validación de contenido
 * - Filtros de caracteres peligrosos
 */

/**
 * Función para sanitizar contra XSS
 * Elimina scripts, eventos y etiquetas HTML peligrosas
 */
export function sanitizeAgainstXSS(input) {
  if (typeof input !== 'string') return input;

  return input
    // Eliminar etiquetas script completas
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Eliminar etiquetas iframe
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Eliminar otros iframe maliciosos
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    // Eliminar event handlers
    .replace(/\s*on\w+\s*=\s*["']?[^"'`]*["']?/gi, '')
    // Eliminar javascript: protocol
    .replace(/javascript:/gi, '')
    // Eliminar vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Eliminar data: protocol malicioso
    .replace(/data:text\/html/gi, '')
    // Eliminar caracteres de control peligrosos
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // HTML encode caracteres especiales peligrosos
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Valida si una cadena contiene intentos de XSS
 */
export function containsXSSAttempt(input) {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script\b/gi,
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*onerror/gi,
    /<svg[^>]*onload/gi,
    /<body[^>]*onload/gi,
    /data:text\/html/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /import\s+/gi,
    /document\.\w+/gi,
    /window\.\w+/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitiza un objeto recursivamente contra XSS
 */
export function sanitizeObjectAgainstXSS(obj, excludeFields = ['password', 'token']) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeAgainstXSS(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectAgainstXSS(item, excludeFields));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (excludeFields.includes(key)) {
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeAgainstXSS(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObjectAgainstXSS(value, excludeFields);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Middleware Express para protección contra XSS
 * Aplica a campos específicos (comments, reviews, etc.)
 */
export function xssProtectionMiddleware(fieldsToSanitize = ['comment', 'review', 'content', 'text', 'description']) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of fieldsToSanitize) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          // Validar si contiene intentos de XSS
          if (containsXSSAttempt(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: `El campo "${field}" contiene contenido potencialmente peligroso`,
              code: 'XSS_ATTEMPT_DETECTED'
            });
          }

          // Sanitizar
          req.body[field] = sanitizeAgainstXSS(req.body[field]);
        }
      }
    }

    next();
  };
}

/**
 * Validador estricto para reseñas
 * Solo permite texto plano y emojis seguros
 */
export function validateReviewContent(content) {
  if (typeof content !== 'string') {
    return {
      valid: false,
      message: 'La reseña debe ser texto'
    };
  }

  // Longitud
  if (content.length < 5 || content.length > 500) {
    return {
      valid: false,
      message: 'La reseña debe tener entre 5 y 500 caracteres'
    };
  }

  // Contiene XSS
  if (containsXSSAttempt(content)) {
    return {
      valid: false,
      message: 'La reseña contiene contenido no permitido'
    };
  }

  return {
    valid: true,
    sanitized: sanitizeAgainstXSS(content)
  };
}

/**
 * Escape HTML de forma segura para mostrar en frontend
 */
export function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Content Security Policy para reseñas
 * Retorna objeto HTML-safe de la reseña
 */
export function createSafeReview(review) {
  const validation = validateReviewContent(review);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  return {
    content: escapeHTML(validation.sanitized),
    raw: validation.sanitized
  };
}
