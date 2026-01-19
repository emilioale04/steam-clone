/**
 * Utilidades para Prepared Statements
 * Grupo 2 - Seguridad Steamworks
 * 
 * Mitigación de SQL Injection mediante:
 * - Prepared Statements (Parameterized Queries)
 * - Validación de parámetros
 * - Logging de queries peligrosas
 */

/**
 * Clase QueryBuilder con Prepared Statements
 * Construye queries seguras con parámetros
 */
export class PreparedQuery {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
    this.params = [];
    this.placeholders = [];
  }

  /**
   * Añade un parámetro a la query de forma segura
   * @param {*} value - Valor a parametrizar
   * @returns {PreparedQuery} para encadenamiento
   */
  addParam(value) {
    this.params.push(value);
    const index = this.params.length;
    
    // Para PostgreSQL: $1, $2, etc.
    this.placeholders.push(`$${index}`);
    return this;
  }

  /**
   * Añade múltiples parámetros
   */
  addParams(values) {
    values.forEach(value => this.addParam(value));
    return this;
  }

  /**
   * Retorna la query con placeholders
   */
  getQuery() {
    let query = this.baseQuery;
    this.placeholders.forEach((placeholder, index) => {
      query = query.replace('?', placeholder);
    });
    return query;
  }

  /**
   * Retorna los parámetros
   */
  getParams() {
    return this.params;
  }

  /**
   * Retorna query y parámetros juntos
   */
  build() {
    return {
      query: this.getQuery(),
      params: this.getParams()
    };
  }
}

/**
 * Validador de parámetros de query
 * Previene inyecciones SQL comunes
 */
export class ParameterValidator {
  /**
   * Valida un parámetro antes de usarlo en query
   */
  static validate(param, type = 'string') {
    switch (type) {
      case 'email':
        return this.validateEmail(param);
      case 'username':
        return this.validateUsername(param);
      case 'number':
        return this.validateNumber(param);
      case 'string':
        return this.validateString(param);
      case 'uuid':
        return this.validateUUID(param);
      default:
        return this.validateString(param);
    }
  }

  static validateEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email;
  }

  static validateUsername(username) {
    if (typeof username !== 'string') {
      throw new Error('Username must be a string');
    }
    if (username.length < 3 || username.length > 32) {
      throw new Error('Username must be 3-32 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username contains invalid characters');
    }
    return username;
  }

  static validateNumber(num) {
    const n = Number(num);
    if (isNaN(n)) {
      throw new Error('Invalid number');
    }
    return n;
  }

  static validateString(str) {
    if (typeof str !== 'string') {
      throw new Error('Must be a string');
    }
    if (str.length > 5000) {
      throw new Error('String exceeds maximum length');
    }
    // Detectar palabras clave SQL
    const sqlKeywords = /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|--|\*)\b)/gi;
    if (sqlKeywords.test(str)) {
      throw new Error('String contains suspicious SQL keywords');
    }
    return str;
  }

  static validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error('Invalid UUID format');
    }
    return uuid;
  }
}

/**
 * Builder para queries seguras comunes
 */
export class SafeQueryBuilder {
  /**
   * SELECT query segura
   * Uso: SafeQueryBuilder.select('users').where('email = ?', [email])
   */
  static select(table, columns = ['*']) {
    this.validateTableName(table);
    const columnStr = columns.join(', ');
    return new PreparedQuery(`SELECT ${columnStr} FROM ${table}`);
  }

  /**
   * INSERT query segura
   */
  static insert(table, fields) {
    this.validateTableName(table);
    fields.forEach(field => this.validateColumnName(field));
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    return new PreparedQuery(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`);
  }

  /**
   * UPDATE query segura
   */
  static update(table, fields) {
    this.validateTableName(table);
    fields.forEach(field => this.validateColumnName(field));
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    return new PreparedQuery(`UPDATE ${table} SET ${setClause}`);
  }

  /**
   * DELETE query segura
   */
  static delete(table) {
    this.validateTableName(table);
    return new PreparedQuery(`DELETE FROM ${table}`);
  }

  /**
   * Añade WHERE clause segura
   */
  static where(query, condition, params) {
    query.addParams(params);
    query.baseQuery += ` WHERE ${condition}`;
    return query;
  }

  /**
   * Valida nombre de tabla
   */
  static validateTableName(table) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
  }

  /**
   * Valida nombre de columna
   */
  static validateColumnName(column) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }
  }
}

/**
 * Logging para detectar intentos de SQL injection
 */
export class SQLInjectionDetector {
  static suspiciousPatterns = [
    /union\s+select/gi,
    /insert\s+into/gi,
    /update\s+\w+\s+set/gi,
    /delete\s+from/gi,
    /drop\s+(table|database)/gi,
    /--\s*\w+/g,
    /\/\*.*?\*\//g,
    /xp_\w+/gi,
    /sp_\w+/gi,
    /;.*?(SELECT|INSERT|UPDATE|DELETE)/gi
  ];

  /**
   * Detecta patrones de SQL injection
   */
  static detect(input) {
    if (typeof input !== 'string') return false;

    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Valida y loguea intentos de inyección
   */
  static validateAndLog(params, logger) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && this.detect(value)) {
        if (logger) {
          logger.warn(`[SQL INJECTION ATTEMPT DETECTED] Field: ${key}, Value: ${value}`);
        }
        throw new Error(`Suspicious input detected in field: ${key}`);
      }
    }
    return true;
  }
}

/**
 * Middleware para validar parámetros de query
 */
export function sqlInjectionProtectionMiddleware(logger = null) {
  return (req, res, next) => {
    try {
      // Validar query parameters
      SQLInjectionDetector.validateAndLog(req.query, logger);
      
      // Validar body parameters
      if (req.body && typeof req.body === 'object') {
        SQLInjectionDetector.validateAndLog(req.body, logger);
      }

      next();
    } catch (error) {
      if (logger) {
        logger.error(`[SQL INJECTION PROTECTION] ${error.message}`);
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected',
        code: 'INVALID_INPUT'
      });
    }
  };
}

/**
 * Ejemplo de uso con Supabase
 */
export class SupabaseQueryBuilder {
  /**
   * Construye query segura con Supabase
   * Uso: SupabaseQueryBuilder.selectUsers().where('email', '=', email)
   */
  static selectUsers(columns = ['*']) {
    return {
      columns,
      where: (column, operator, value) => ({
        build: () => ({ column, operator, value })
      })
    };
  }

  /**
   * Valida antes de ejecutar
   */
  static executeWithValidation(params) {
    const validator = new ParameterValidator();
    for (const [key, value] of Object.entries(params)) {
      validator.validate(value, 'string');
    }
    return params;
  }
}
