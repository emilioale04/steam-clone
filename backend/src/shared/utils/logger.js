import winston from 'winston';
import path from 'path';

// Definir niveles de log personalizados si es necesario, pero los de npm son estándar
// error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determinar el nivel de log basado en el entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Definir colores para los logs en consola
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para logs en consola (más legible para humanos)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.metadata ? JSON.stringify(info.metadata) : ''}`
  )
);

// Formato para logs en archivo/externos (JSON estructurado)
// Esto facilita que herramientas como logstash, datadog, splunk, etc. los ingieran.
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Transports (destinos de los logs)
const transports = [
  // Consola: siempre útil
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Archivo de errores: para logs críticos
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat,
  }),
  
  // Archivo combinado: todos los logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: jsonFormat,
  }),
];

/* 
 * Logger interno base 
 */
const loggerInstance = winston.createLogger({
  level: level(),
  levels,
  transports,
});

/*
 * Función factory para crear loggers con contexto
 * Esto permite etiquetar los logs con el servicio que los originó (ej: 'InventoryService')
 */
export const createLogger = (serviceName) => {
  return {
    error: (message, meta = {}) => {
      loggerInstance.error(message, { metadata: { service: serviceName, ...meta } });
    },
    warn: (message, meta = {}) => {
      loggerInstance.warn(message, { metadata: { service: serviceName, ...meta } });
    },
    info: (message, meta = {}) => {
      loggerInstance.info(message, { metadata: { service: serviceName, ...meta } });
    },
    http: (message, meta = {}) => {
      loggerInstance.http(message, { metadata: { service: serviceName, ...meta } });
    },
    debug: (message, meta = {}) => {
      loggerInstance.debug(message, { metadata: { service: serviceName, ...meta } });
    },
  };
};

export default loggerInstance;
