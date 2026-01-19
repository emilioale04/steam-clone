/**
 * Feature: Developer Auth (Steamworks)
 * Exporta todos los componentes del módulo de autenticación de desarrolladores
 */

// Routes
export { default as developerAuthRoutes } from './routes/developerAuthRoutes.js';
export { default as developerProfileRoutes } from './routes/developerProfileRoutes.js';

// Controllers
export { developerAuthController } from './controllers/developerAuthController.js';
export { developerProfileController } from './controllers/developerProfileController.js';

// Services
export { developerAuthService } from './services/developerAuthService.js';
export { developerProfileService } from './services/developerProfileService.js';

// Middleware
export {
  requireDesarrollador,
  requireDesarrolladorAdmin,
  requireMfaVerificado,
} from './middleware/developerAuthMiddleware.js';
