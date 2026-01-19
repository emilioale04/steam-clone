/**
 * Pricing Feature Index
 * 
 * Exporta todos los componentes del módulo de gestión de precios
 * Implementa RF-010 (Definición de Precios)
 */

// Routes
export { default as pricingRoutes } from './routes/pricesRoutes.js';

// Services
export { default as pricingService } from './services/pricingService.js';

// Controllers
export * from './controllers/priceController.js';

// Validaciones exportadas para uso en otros módulos
export { 
  validatePriceRange, 
  validateDiscountRange, 
  canUpdatePrice, 
  getDaysSinceLastUpdate 
} from './services/pricingService.js';
