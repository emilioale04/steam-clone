/**
 * Rate Limiting Middleware
 * Grupo 2 - Seguridad Steamworks
 * 
 * Implementa:
 * - RNF-007: Límite de tasa (Rate Limiting)
 * - C7: Límite de solicitudes por minuto
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { auditService } from '../services/auditService.js';

/**
 * Rate limiter general para rutas de autenticación
 * 5 intentos por 15 minutos
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 requests por ventana
  message: {
    success: false,
    message: 'Demasiados intentos desde esta IP, por favor intente nuevamente en 15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: 429, // HTTP 429 Too Many Requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos desde esta IP, por favor intente nuevamente en 15 minutos',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter estricto para login
 * 5 intentos por 15 minutos
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos'
  },
  statusCode: 429
});

/**
 * Rate limiter para registro
 * 3 registros por hora desde la misma IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Demasiados solicitudes de registro desde esta IP. Intente nuevamente en 1 hora'
  },
  statusCode: 429
});

/**
 * Rate limiter general para API
 * 100 requests por 15 minutos
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Límite de solicitudes excedido. Intente nuevamente más tarde'
  },
  statusCode: 429
});

/**
 * Rate limiter para acciones críticas
 * 10 acciones por hora
 */
export const criticalActionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    success: false,
    message: 'Límite de acciones críticas excedido. Intente nuevamente en 1 hora'
  },
  statusCode: 429
});

/**
 * Rate limiter para endpoints críticos (1 solicitud cada 2 segundos)
 */
export const criticalRateLimiter = rateLimit({
  windowMs: 2000,
  max: 1,
  keyGenerator: (req) =>
    req.user?.id
      ? `user:${req.user.id}`
      : ipKeyGenerator(req),

  handler: async (req, res) => {
    await auditService.registrarRateLimitExcedido(
      req.originalUrl,
      req.ip,
      req.headers['user-agent']
    );

    res.status(429).json({
      success: false,
      message: 'Muchas solicitudes en poco tiempo. Por favor, espere un momento antes de intentar nuevamente.',
    });
  },
});
