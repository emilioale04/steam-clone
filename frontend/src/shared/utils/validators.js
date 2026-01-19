/**
 * Validadores para Frontend
 * Validaciones con Expresiones Regulares para formularios React
 */

import { useState } from 'react';

/**
 * Validador de Email
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
 */
export const usernameValidator = {
  pattern: /^[a-zA-Z0-9]([a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])?$/,
  minLength: 3,
  maxLength: 32,
  test(username) {
    if (!username || username.length < this.minLength || username.length > this.maxLength) {
      return false;
    }
    return this.pattern.test(username);
  },
  message: 'Username: 3-32 caracteres (letras, números, guiones)'
};

/**
 * Validador de Contraseña
 */
export const passwordValidator = {
  minLength: 8,
  maxLength: 128,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_=+{};:'",.<>?\\|`~])[a-zA-Z0-9!@#$%^&*\-_=+{};:'",.<>?\\|`~]{8,}$/,
  test(password) {
    if (!password || password.length < this.minLength) {
      return false;
    }
    return this.pattern.test(password);
  },
  message: 'Contraseña: 8+ caracteres con mayúscula, minúscula, número y símbolo'
};

/**
 * Validador de Reseña/Comentario
 */
export const reviewValidator = {
  minLength: 5,
  maxLength: 500,
  dangerousPattern: /<script|<iframe|<embed|<object|javascript:|on\w+\s*=|<\s*\/?\s*\w+/gi,
  test(review) {
    if (!review || review.length < this.minLength || review.length > this.maxLength) {
      return false;
    }
    return !this.dangerousPattern.test(review);
  },
  message: 'Reseña: 5-500 caracteres sin HTML ni scripts',
  clean(review) {
    let cleaned = review
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
    return cleaned.substring(0, this.maxLength);
  }
};

/**
 * Validador de búsqueda
 */
export const searchValidator = {
  minLength: 1,
  maxLength: 100,
  sqlKeywordsPattern: /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|--|\*|;)\b)/gi,
  test(query) {
    if (!query || query.length < this.minLength || query.length > this.maxLength) {
      return false;
    }
    return !this.sqlKeywordsPattern.test(query);
  },
  message: 'Búsqueda inválida'
};

/**
 * Función para validar campo individual
 */
export function validateField(fieldName, value) {
  const validators = {
    email: emailValidator,
    username: usernameValidator,
    password: passwordValidator,
    review: reviewValidator,
    search: searchValidator
  };

  const validator = validators[fieldName];
  if (!validator) return { valid: true };

  if (!validator.test(value)) {
    return { valid: false, message: validator.message };
  }

  return {
    valid: true,
    value: validator.clean ? validator.clean(value) : value
  };
}

/**
 * Hook de validación para React
 */
export function useFormValidation(initialState = {}) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (fieldName, value) => {
    const result = validateField(fieldName, value);
    return result;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const result = validate(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: result.valid ? undefined : result.message
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const result = validate(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: result.valid ? undefined : result.message
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    for (const [fieldName, value] of Object.entries(values)) {
      const result = validate(fieldName, value);
      if (!result.valid) {
        newErrors[fieldName] = result.message;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues,
    setErrors
  };
}
