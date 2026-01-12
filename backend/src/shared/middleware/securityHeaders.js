/**
 * Security Headers Middleware
 * Grupo 2 - Seguridad Steamworks
 * 
 * Implementa:
 * - Security Headers (HSTS, CSP, etc.)
 * - Protección contra XSS, clickjacking, etc.
 */

import helmet from 'helmet';

/**
 * Configuración de Helmet para security headers
 * Implementa las cabeceras de seguridad requeridas en Steamworks_Indications.md
 */
export const securityHeaders = helmet({
  // Strict-Transport-Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline para Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3000', 'https://zskmxoddmssjgwgsjpij.supabase.co'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // X-Content-Type-Options: nosniff
  noSniff: true,

  // X-Frame-Options: DENY
  frameguard: {
    action: 'deny'
  },

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  }
});

/**
 * Custom security headers adicionales
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // Permissions Policy (antes Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};
