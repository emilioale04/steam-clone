// backend/src/features/auth/index.js

// Usamos "* as" para agrupar todas las funciones (login, register...) en un objeto
export * as authController from './controllers/authController.js';
export { authService } from './services/authService.js';
export { default as authRoutes } from './routes/authRoutes.js';