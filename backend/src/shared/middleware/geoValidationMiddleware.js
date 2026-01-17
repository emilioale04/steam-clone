import axios from 'axios';
import { auditService } from '../../shared/services/auditService.js';

// Países bloqueados (solo lectura)
const BLOCKED_COUNTRIES = Object.freeze(['CU', 'IR', 'KP']);

/**
 * Middleware de validación geográfica (Proceso 4.0)
 * - Usa IPinfo /lite/me
 * - Fail-Closed
 * - Token vía .env
 */
export const geoValidationMiddleware = async (req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  try {
    if (!process.env.IPINFO_BASE_URL || !process.env.IPINFO_TOKEN) {
      throw new Error('GeoIP configuration missing');
    }

    const response = await axios.get(
      `${process.env.IPINFO_BASE_URL}/lite/me`,
      {
        params: { token: process.env.IPINFO_TOKEN },
        timeout: 2000,
      }
    );

    const geoData = response.data;

    if (!geoData?.country) {
      throw new Error('Invalid GeoIP response');
    }

    const userCountry = geoData.country;

    if (BLOCKED_COUNTRIES.includes(userCountry)) {
      await auditService.logEvent({
        userId: req.user?.id || null,
        ip,
        country: userCountry,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString(),
        reason: 'Blocked country',
      });

      return res.status(403).json({
        message: 'Operation not allowed',
      });
    }

    // Contexto de autorización
    req.authContext ??= {};
    req.authContext.geo = { country: userCountry };

    next();
  } catch (error) {
    await auditService.logEvent({
      userId: req.user?.id || null,
      ip,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString(),
      reason: 'GeoIP failure',
    });

    return res.status(403).json({
      message: 'Operation not allowed',
    });
  }
};
