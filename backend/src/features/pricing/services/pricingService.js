/**
 * Pricing Service - Lógica de negocio para gestión de precios
 * 
 * Implementa los requisitos:
 * - RF-010: Definición de Precios ($0 - $1000 USD)
 * - C11: Validación precio > 0 (o == 0 para F2P)
 * - C12: Validación rango de precios
 * - C18: Validación estricta de propiedad
 * - Política ABAC: 30 días entre cambios de precio
 */

import { supabaseAdmin } from '../../../shared/config/supabase.js';

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const DAYS_BETWEEN_PRICE_CHANGES = 30;
const DISCOUNT_MIN = 0;
const DISCOUNT_MAX = 1; // 100% máximo

/**
 * Valida que el precio esté dentro del rango permitido (C11, C12)
 */
function validatePriceRange(price) {
  const numPrice = Number(price);
  
  if (isNaN(numPrice)) {
    return { valid: false, error: 'El precio debe ser un número válido' };
  }
  
  if (numPrice < PRICE_MIN) {
    return { valid: false, error: `El precio no puede ser negativo (C11)` };
  }
  
  if (numPrice > PRICE_MAX) {
    return { valid: false, error: `El precio no puede exceder $${PRICE_MAX} USD (C12)` };
  }
  
  return { valid: true };
}

/**
 * Valida que el descuento esté dentro del rango permitido
 */
function validateDiscountRange(discount) {
  const numDiscount = Number(discount);
  
  if (isNaN(numDiscount)) {
    return { valid: false, error: 'El descuento debe ser un número válido' };
  }
  
  if (numDiscount < DISCOUNT_MIN || numDiscount > DISCOUNT_MAX) {
    return { valid: false, error: `El descuento debe estar entre ${DISCOUNT_MIN} y ${DISCOUNT_MAX} (0% a 100%)` };
  }
  
  return { valid: true };
}

/**
 * Calcula los días transcurridos desde la última actualización
 */
function getDaysSinceLastUpdate(lastUpdateDate) {
  if (!lastUpdateDate) return Infinity; // Nunca se ha actualizado
  
  const lastUpdate = new Date(lastUpdateDate);
  const now = new Date();
  const diffTime = now - lastUpdate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays;
}

/**
 * Verifica si se puede actualizar el precio (regla de 30 días)
 */
function canUpdatePrice(lastUpdateDate) {
  const daysSinceUpdate = getDaysSinceLastUpdate(lastUpdateDate);
  return daysSinceUpdate >= DAYS_BETWEEN_PRICE_CHANGES;
}

const pricingService = {
  /**
   * Obtiene las aplicaciones del desarrollador que pueden editar precios
   * Solo aplicaciones con estado 'aprobado' o 'publicado' (Política ABAC)
   * 
   * @param {string} developerId - UUID del desarrollador
   * @returns {Object} Lista de aplicaciones con información de precios
   */
  getDeveloperApps: async (developerId) => {
    try {
      const { data: apps, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select(`
          id,
          app_id,
          nombre_juego,
          descripcion_corta,
          precio_base_usd,
          descuento,
          estado_revision,
          updated_at,
          created_at
        `)
        .eq('desarrollador_id', developerId)
        .in('estado_revision', ['aprobado', 'publicado'])
        .order('nombre_juego', { ascending: true });

      if (error) {
        console.error('Error al obtener aplicaciones:', error);
        throw new Error('Error al consultar las aplicaciones');
      }

      // Mapear con información adicional para el frontend
      const appsWithPriceInfo = (apps || []).map(app => {
        const daysSinceUpdate = getDaysSinceLastUpdate(app.updated_at);
        const canUpdate = daysSinceUpdate >= DAYS_BETWEEN_PRICE_CHANGES;
        const daysRemaining = canUpdate ? 0 : Math.ceil(DAYS_BETWEEN_PRICE_CHANGES - daysSinceUpdate);

        return {
          id: app.id,
          app_id: app.app_id,
          nombre_juego: app.nombre_juego,
          descripcion_corta: app.descripcion_corta,
          precio_base_usd: app.precio_base_usd,
          descuento: app.descuento || 0,
          estado_revision: app.estado_revision,
          updated_at: app.updated_at,
          // Información de restricción de 30 días
          can_update_price: canUpdate,
          days_until_update: daysRemaining,
          last_price_change: app.updated_at
        };
      });

      return {
        success: true,
        apps: appsWithPriceInfo,
        total: appsWithPriceInfo.length
      };

    } catch (error) {
      console.error('Error en getDeveloperApps:', error);
      throw error;
    }
  },

  /**
   * Obtiene una aplicación específica con validación de propiedad (C18)
   * 
   * @param {string} appId - UUID de la aplicación
   * @param {string} developerId - UUID del desarrollador
   * @returns {Object} Datos de la aplicación si es propietario
   */
  getAppById: async (appId, developerId) => {
    try {
      const { data: app, error } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .select('*')
        .eq('id', appId)
        .single();

      if (error || !app) {
        return { success: false, error: 'Aplicación no encontrada' };
      }

      // Validación de propiedad
      if (app.desarrollador_id !== developerId) {
        return { 
          success: false, 
          error: 'No tienes permiso para acceder a esta aplicación' 
        };
      }

      return { success: true, app };

    } catch (error) {
      console.error('Error en getAppById:', error);
      throw error;
    }
  },

  /**
   * Actualiza el precio de una aplicación
   * Implementa RF-010 y Política ABAC 4
   * 
   * @param {string} appId - UUID de la aplicación
   * @param {string} developerId - UUID del desarrollador
   * @param {number} newPrice - Nuevo precio en USD
   * @returns {Object} Resultado de la operación
   */
  updatePrice: async (appId, developerId, newPrice) => {
    try {
      // 1. Validar rango de precio (C11, C12)
      const priceValidation = validatePriceRange(newPrice);
      if (!priceValidation.valid) {
        return { success: false, error: priceValidation.error };
      }

      // 2. Obtener aplicación y verificar propiedad (C18)
      const appResult = await pricingService.getAppById(appId, developerId);
      if (!appResult.success) {
        return appResult;
      }

      const app = appResult.app;

      // 3. Verificar estado de la aplicación (Política ABAC: Estado == 'Approved')
      if (!['aprobado', 'publicado'].includes(app.estado_revision)) {
        return {
          success: false,
          error: 'Solo se pueden editar precios de aplicaciones aprobadas o publicadas'
        };
      }

      // 4. Verificar regla de 30 días (Política ABAC)
      if (!canUpdatePrice(app.updated_at)) {
        const daysSince = getDaysSinceLastUpdate(app.updated_at);
        const daysRemaining = Math.ceil(DAYS_BETWEEN_PRICE_CHANGES - daysSince);
        
        return {
          success: false,
          error: `Debes esperar ${daysRemaining} día(s) más para cambiar el precio. Solo se permite un cambio cada ${DAYS_BETWEEN_PRICE_CHANGES} días.`
        };
      }

      // 5. Validar que el precio sea diferente al actual
      if (Number(app.precio_base_usd) === Number(newPrice)) {
        return {
          success: false,
          error: 'El nuevo precio debe ser diferente al precio actual'
        };
      }

      // 6. Actualizar precio
      const { data: updatedApp, error: updateError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          precio_base_usd: Number(newPrice),
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .eq('desarrollador_id', developerId) // Doble verificación de propiedad
        .select()
        .single();

      if (updateError) {
        console.error('Error al actualizar precio:', updateError);
        throw new Error('Error al actualizar el precio en la base de datos');
      }

      return {
        success: true,
        message: 'Precio actualizado correctamente',
        app: {
          id: updatedApp.id,
          nombre_juego: updatedApp.nombre_juego,
          precio_anterior: app.precio_base_usd,
          precio_nuevo: updatedApp.precio_base_usd,
          updated_at: updatedApp.updated_at,
          next_update_available: new Date(Date.now() + DAYS_BETWEEN_PRICE_CHANGES * 24 * 60 * 60 * 1000).toISOString()
        }
      };

    } catch (error) {
      console.error('Error en updatePrice:', error);
      throw error;
    }
  },

  /**
   * Actualiza el descuento de una aplicación
   * 
   * @param {string} appId - UUID de la aplicación
   * @param {string} developerId - UUID del desarrollador
   * @param {number} newDiscount - Nuevo descuento (0 a 1)
   * @returns {Object} Resultado de la operación
   */
  updateDiscount: async (appId, developerId, newDiscount) => {
    try {
      // 1. Validar rango de descuento
      const discountValidation = validateDiscountRange(newDiscount);
      if (!discountValidation.valid) {
        return { success: false, error: discountValidation.error };
      }

      // 2. Obtener aplicación y verificar propiedad (C18)
      const appResult = await pricingService.getAppById(appId, developerId);
      if (!appResult.success) {
        return appResult;
      }

      const app = appResult.app;

      // 3. Verificar estado de la aplicación
      if (!['aprobado', 'publicado'].includes(app.estado_revision)) {
        return {
          success: false,
          error: 'Solo se pueden editar descuentos de aplicaciones aprobadas o publicadas'
        };
      }

      // 4. Validar que el descuento sea diferente al actual
      const currentDiscount = Number(app.descuento || 0);
      if (currentDiscount === Number(newDiscount)) {
        return {
          success: false,
          error: 'El nuevo descuento debe ser diferente al descuento actual'
        };
      }

      // 5. Actualizar descuento (no tiene restricción de 30 días)
      const { data: updatedApp, error: updateError } = await supabaseAdmin
        .from('aplicaciones_desarrolladores')
        .update({
          descuento: Number(newDiscount)
        })
        .eq('id', appId)
        .eq('desarrollador_id', developerId)
        .select()
        .single();

      if (updateError) {
        console.error('Error al actualizar descuento:', updateError);
        throw new Error('Error al actualizar el descuento en la base de datos');
      }

      // Calcular precio final con descuento
      const precioFinal = updatedApp.precio_base_usd * (1 - newDiscount);

      return {
        success: true,
        message: 'Descuento actualizado correctamente',
        app: {
          id: updatedApp.id,
          nombre_juego: updatedApp.nombre_juego,
          precio_base_usd: updatedApp.precio_base_usd,
          descuento: updatedApp.descuento,
          precio_final: precioFinal.toFixed(2)
        }
      };

    } catch (error) {
      console.error('Error en updateDiscount:', error);
      throw error;
    }
  }
};

export default pricingService;
export { validatePriceRange, validateDiscountRange, canUpdatePrice, getDaysSinceLastUpdate };
