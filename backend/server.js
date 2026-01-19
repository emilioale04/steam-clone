import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import auth routes
import { authRoutes } from './src/features/auth/index.js';

// Import developer auth routes (Steamworks)
import {
  developerAuthRoutes,
  developerProfileRoutes,
} from './src/features/developer-auth/index.js';

// Import admin routes
import { adminRoutes } from './src/features/admin/index.js';

// Import inventory routes (Esteban - Gestión de Inventario)
import { inventoryRoutes } from './src/features/inventory/index.js';
import { tradeRoutes } from './src/features/inventory/index.js';
import { privacyRoutes } from './src/features/inventory/index.js';

// Import wallet routes (Gestión de Billetera)
import { walletRoutes } from './src/features/wallet/index.js';

// Import MFA routes
import mfaRoutes from './src/features/mfa/routes/mfaRoutes.js';

// Import community routes
import registerCommunityRoutes from './src/features/community/index.js';
// Import game keys routes (Grupo 2 - Gestión de Llaves)
import { gameKeysRoutes } from './src/features/game-keys/index.js';

// Import new app routes (Creación de Aplicaciones - RF-004)
import { newAppRoutes } from './src/features/new-app/index.js';
import { appItemsRoutes } from './src/features/app-items/index.js';

// Import security middleware (Grupo 2 - Seguridad)
import {
  securityHeaders,
  additionalSecurityHeaders,
} from './src/shared/middleware/securityHeaders.js';
import {
  apiLimiter,
  criticalRateLimiter,
} from './src/shared/middleware/rateLimiter.js';
import { sanitizeBodyMiddleware } from './src/shared/utils/sanitization.js';

// Import session service for cleanup (Grupo 2 - Gestión de Sesiones)
import { sessionService } from './src/shared/services/sessionService.js';

// Import limited account validation middleware
import { limitedAccountValidationMiddleware } from './src/shared/middleware/limitedAccountValidationMiddleware.js';
import { geoValidationMiddleware } from './src/shared/middleware/geoValidationMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.IPINFO_BASE_URL || !process.env.IPINFO_TOKEN) {
  throw new Error(
    'Falla en la configuración de GeoIP: variables de entorno faltantes',
  );
}

// Security Middleware (DEBE IR PRIMERO)
// RNF-002: HTTPS/TLS headers
// Security Headers: HSTS, CSP, X-Frame-Options, etc.
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

// CORS - configured for secure cookie handling
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
  }),
);

// Cookie parser for httpOnly cookies
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Body parsing
app.use(express.json());

// Sanitización de inputs (C3: Prevención de inyecciones)
app.use(sanitizeBodyMiddleware);

// Rate limiting for auth routes only (C7: RNF-007)

// Auth routes (usuarios normales)
app.use('/api/auth', apiLimiter, authRoutes);

// Developer auth routes (Steamworks - desarrolladores)
app.use('/api/desarrolladores/auth', apiLimiter, developerAuthRoutes);

// Developer profile routes (Steamworks - gestión de perfil)
app.use('/api/desarrolladores/perfil', apiLimiter, developerProfileRoutes);

// Game Keys routes (Santiago - Gestión de Llaves de Juego)
app.use('/api/game-keys', gameKeysRoutes);

// New App routes (Creación de Aplicaciones - RF-004)
app.use('/api/new-app', newAppRoutes);
app.use('/api/app-items', apiLimiter, appItemsRoutes);

// Admin routes
app.use('/api/admin', apiLimiter, adminRoutes);

// MFA routes
app.use('/api/mfa', apiLimiter, mfaRoutes);

// Community routes
registerCommunityRoutes(app);
// Wallet routes (Gestión de Billetera)
app.use('/api/wallet', apiLimiter, walletRoutes);

// Inventory routes (Esteban - Gestión de Inventario)
app.use('/api/inventory', inventoryRoutes);

// Trade routes
app.use('/api/trade', tradeRoutes);

// Privacy routes (Configuración de privacidad)
app.use('/api/privacy', apiLimiter, privacyRoutes);

// Datos de ejemplo
const games = [
  {
    id: 1,
    title: 'Space Explorer',
    price: 49.99,
    rating: 4.8,
    description: 'Explora galaxias lejanas en esta aventura épica',
    genre: 'Aventura',
    releaseDate: '2025-03-15',
    discount: 0,
  },
  {
    id: 2,
    title: 'Medieval Quest',
    price: 39.99,
    rating: 4.5,
    description: 'Una aventura medieval llena de acción y magia',
    genre: 'RPG',
    releaseDate: '2024-11-20',
    discount: 20,
  },
  {
    id: 3,
    title: 'Racing Legends',
    price: 29.99,
    rating: 4.7,
    description: 'La mejor experiencia de carreras del año',
    genre: 'Racing',
    releaseDate: '2025-01-05',
    discount: 15,
  },
  {
    id: 4,
    title: 'Puzzle Master',
    price: 19.99,
    rating: 4.3,
    description: 'Desafía tu mente con puzzles increíbles',
    genre: 'Puzzle',
    releaseDate: '2024-09-10',
    discount: 0,
  },
  {
    id: 5,
    title: 'Battle Royale',
    price: 0,
    rating: 4.6,
    description: '100 jugadores, solo uno puede ganar',
    genre: 'Shooter',
    releaseDate: '2024-06-01',
    discount: 0,
  },
  {
    id: 6,
    title: 'City Builder',
    price: 44.99,
    rating: 4.9,
    description: 'Construye la ciudad de tus sueños',
    genre: 'Simulación',
    releaseDate: '2025-02-28',
    discount: 10,
  },
];

// Trade items (Jeff - Gestión de Intercambios)
app.use('/api/trade', tradeRoutes);

const featuredGame = {
  id: 7,
  title: 'Cyberpunk Adventures',
  price: 59.99,
  discount: 30,
  rating: 4.8,
  description: 'Sumérgete en un mundo futurista lleno de peligro y tecnología',
  genre: 'Acción/RPG',
  releaseDate: '2025-12-10',
  image:
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop',
};

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'Steam Clone API',
    version: '1.0.0',
    endpoints: {
      games: '/api/games',
      featuredGame: '/api/featured',
      gameById: '/api/games/:id',
    },
  });
});

// Obtener todos los juegos
app.get('/api/games', (req, res) => {
  const { genre, minRating } = req.query;

  let filteredGames = [...games];

  if (genre) {
    filteredGames = filteredGames.filter((game) =>
      game.genre.toLowerCase().includes(genre.toLowerCase()),
    );
  }

  if (minRating) {
    filteredGames = filteredGames.filter(
      (game) => game.rating >= parseFloat(minRating),
    );
  }

  res.json({
    success: true,
    count: filteredGames.length,
    games: filteredGames,
  });
});

// Obtener juego destacado
app.get('/api/featured', (req, res) => {
  res.json({
    success: true,
    game: featuredGame,
  });
});

// Obtener juego por ID
app.get('/api/games/:id', (req, res) => {
  const { id } = req.params;
  const game = games.find((g) => g.id === parseInt(id));

  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Juego no encontrado',
    });
  }

  res.json({
    success: true,
    game,
  });
});

// Búsqueda de juegos
app.get('/api/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Parámetro de búsqueda requerido',
    });
  }

  const results = games.filter(
    (game) =>
      game.title.toLowerCase().includes(q.toLowerCase()) ||
      game.description.toLowerCase().includes(q.toLowerCase()),
  );

  res.json({
    success: true,
    count: results.length,
    games: results,
  });
});

// Middleware de validación geográfica
app.use(geoValidationMiddleware);

// Middleware de validación de cuentas limitadas
app.use(limitedAccountValidationMiddleware);

// Aplicar Rate Limiting a endpoints críticos
app.use('/api/trade', criticalRateLimiter, tradeRoutes);
app.use('/api/inventory', criticalRateLimiter, inventoryRoutes);
app.use('/api/search', criticalRateLimiter);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Variable para almacenar el ID del interval de limpieza de sesiones
let sessionCleanupInterval = null;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);

  // Iniciar limpieza periódica de sesiones expiradas (cada hora)
  // C15: Gestión robusta de sesiones
  const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora
  sessionCleanupInterval = setInterval(async () => {
    try {
      console.log('[CLEANUP] Iniciando limpieza de sesiones expiradas...');
      await sessionService.limpiarSesionesExpiradas();
      console.log('[CLEANUP] Limpieza de sesiones completada');
    } catch (error) {
      console.error('[CLEANUP] Error al limpiar sesiones:', error);
    }
  }, SESSION_CLEANUP_INTERVAL);

  console.log('🧹 Limpieza automática de sesiones configurada (cada hora)');
});

// Manejo de cierre graceful del servidor
// Esto previene memory leaks y procesos huérfanos al detener/reiniciar el servidor
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} recibido. Cerrando servidor de forma graceful...`);

  // Limpiar el interval de sesiones
  if (sessionCleanupInterval) {
    clearInterval(sessionCleanupInterval);
    console.log('✓ Interval de limpieza de sesiones detenido');
  }

  // Forzar cierre después de 10 segundos si no se completa
  const forceShutdownTimeout = setTimeout(() => {
    console.error(
      '⚠️ No se pudo cerrar el servidor de forma graceful, forzando cierre...',
    );
    process.exit(1);
  }, 10000);

  // Cerrar el servidor HTTP
  server.close((err) => {
    if (err) {
      console.error('✗ Error al cerrar servidor HTTP:', err);
      process.exit(1);
    }
    clearTimeout(forceShutdownTimeout);
    console.log('✓ Servidor HTTP cerrado');
    process.exit(0);
  });
};

// Escuchar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
