import axios from 'axios';
import { auditService } from '../../shared/services/auditService.js';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase (SERVICE ROLE)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware de validación geográfica (Proceso 4.0)
 * - IPinfo Lite
 * - Supabase como fuente de países bloqueados
 * - Fail-Closed
 * - Auditoría obligatoria
 */
const geoValidationMiddleware = async (req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  try {
    // Validación de configuración
    if (!process.env.IPINFO_TOKEN) {
      throw new Error('Missing IPINFO_TOKEN');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Consulta IPinfo
    const response = await axios.get(
      `https://api.ipinfo.io/lite/${ip}`,
      {
        params: { token: process.env.IPINFO_TOKEN },
        timeout: 2000,
      }
    );

    const geoData = response.data;

    // IPs privadas / reservadas
    if (geoData?.bogon === true) {
      console.warn(`[GEO] IP reservada detectada: ${ip}`);
      return next();
    }

    const countryCode = geoData?.country_code;
    const country = geoData?.country;

    if (!countryCode) {
      throw new Error('Invalid GeoIP response');
    }

    // Consulta Supabase
    const { data, error } = await supabase
      .from('bloqueos_paises')
      .select('codigo_pais')
      .eq('estado', 'bloqueado');

    if (error || !data) {
      throw new Error('Failed to fetch blocked countries');
    }

    const blockedCodes = data.map((row) => row.codigo_pais);

    // Bloqueo geográfico
    if (blockedCodes.includes(countryCode)) {
      await auditService.registrarEvento({
        desarrolladorId: req.user?.id || null,
        accion: 'bloqueo_geografico',
        detalles: {
          ip,
          countryCode,
          country,
          endpoint: req.originalUrl,
          reason: 'Blocked country',
        },
        ipAddress: ip,
        resultado: 'bloqueado',
      });

      return res.status(403).json({
        success: false,
        errorCode: 'GEO_BLOCKED',
        message: `El acceso desde tu país (${country}) no está permitido.`,
      });
    }

    // Contexto de autorización
    req.authContext ??= {};
    req.authContext.geo = {
      countryCode,
      country,
    };

    next();
  } catch (error) {
    console.error('[GEO ERROR]', error.message);

    await auditService.registrarEvento({
      desarrolladorId: req.user?.id || null,
      accion: 'validacion_geo_fallida',
      detalles: {
        ip,
        endpoint: req.originalUrl,
        error: error.message,
      },
      ipAddress: ip,
      resultado: 'fallido',
    });

    return res.status(403).json({
      message: 'Operation not allowed',
    });
  }
};

export default geoValidationMiddleware;
