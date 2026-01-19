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
 * - GEO_TEST_MODE para pruebas controladas
 */
const geoValidationMiddleware = async (req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  try {
    let countryCode;
    let country = 'UNKNOWN';

    /* =====================================================
       MODO TEST – FUERZA PAÍS DESDE VARIABLE DE ENTORNO
       ===================================================== */
    if (process.env.GEO_TEST_MODE === 'true') {
      countryCode = process.env.GEO_TEST_COUNTRY;

      if (!countryCode) {
        throw new Error('GEO_TEST_COUNTRY not defined');
      }

      console.log(
        `[GEO TEST MODE] Country forced to ${countryCode}`
      );
    } else {
      /* ===============================
         VALIDACIÓN NORMAL CON IPINFO
         =============================== */

      if (!process.env.IPINFO_TOKEN) {
        throw new Error('Missing IPINFO_TOKEN');
      }

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

      countryCode = geoData?.country_code;
      country = geoData?.country;

      if (!countryCode) {
        throw new Error('Invalid GeoIP response');
      }
    }

    /* ===============================
       CONSULTA DE PAÍSES BLOQUEADOS
       =============================== */

    const { data, error } = await supabase
      .from('bloqueos_paises')
      .select('codigo_pais')
      .eq('estado', 'bloqueado');

    console.log('[SUPABASE DATA]', data);
    console.log('[SUPABASE ERROR]', error);

    if (error || !data) {
      throw new Error('Failed to fetch blocked countries');
    }

    const blockedCodes = data.map((row) => row.codigo_pais);

    console.log('[GEO] Blocked countries loaded:', blockedCodes);

    /* ===============================
       BLOQUEO GEOGRÁFICO
       =============================== */
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
          testMode: process.env.GEO_TEST_MODE === 'true',
        },
        ipAddress: ip,
        resultado: 'bloqueado',
      });

      return res.status(403).json({
        success: false,
        errorCode: 'GEO_BLOCKED',
        message: `El acceso desde el país ${countryCode} no está permitido.`,
      });
    }

    /* ===============================
       CONTEXTO DE AUTORIZACIÓN
       =============================== */
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
        testMode: process.env.GEO_TEST_MODE === 'true',
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
