import express from 'express';
import adminController from '../controllers/adminController.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.post('/login', adminController.login);
router.post('/verify-mfa-login', adminController.verifyMFALogin);

// Rutas protegidas (requieren autenticación de admin)
router.post('/logout', adminMiddleware.verificarAdmin, adminController.logout);
router.get('/validate-session', adminMiddleware.verificarAdmin, adminController.validateSession);

// Audit Logs
router.get('/audit-logs', adminMiddleware.verificarAdmin, adminController.getAuditLogs);
router.get('/logs-admin', adminMiddleware.verificarAdmin, adminController.getLogsAdmin);
router.get('/logs-desarrolladores', adminMiddleware.verificarAdmin, adminController.getLogsDesarrolladores);
router.get('/logs-comunidad', adminMiddleware.verificarAdmin, adminController.getLogsComunidad);

// Bloqueo de Países (RA-001)
router.get('/bloqueos-paises', adminMiddleware.verificarAdmin, adminController.getBloqueoPaises);
router.post('/bloqueos-paises', adminMiddleware.verificarAdmin, adminController.createBloqueoPais);
router.put('/bloqueos-paises/:id', adminMiddleware.verificarAdmin, adminController.updateBloqueoPais);
router.delete('/bloqueos-paises/:id', adminMiddleware.verificarAdmin, adminController.deleteBloqueoPais);

// Revisión de Juegos (RA-002)
router.get('/revisiones-juegos', adminMiddleware.verificarAdmin, adminController.getRevisionesJuegos);
router.get('/revisiones-juegos/info/:idJuego', adminMiddleware.verificarAdmin, adminController.getInfoJuegoRevision);
router.post('/revisiones-juegos/:id/aprobar', adminMiddleware.verificarAdmin, adminController.aprobarJuego);
router.post('/revisiones-juegos/:id/rechazar', adminMiddleware.verificarAdmin, adminController.rechazarJuego);

// Sanciones (RA-003)
router.get('/sanciones', adminMiddleware.verificarAdmin, adminController.getSanciones);
router.post('/sanciones', adminMiddleware.verificarAdmin, adminController.crearSancion);
router.put('/sanciones/:id/desactivar', adminMiddleware.verificarAdmin, adminController.desactivarSancion);

// Reportes de Ban
router.get('/reportes-ban', adminMiddleware.verificarAdmin, adminController.getReportesBan);
router.post('/reportes-ban/:id/aprobar', adminMiddleware.verificarAdmin, adminController.aprobarReporteBan);
router.post('/reportes-ban/:id/rechazar', adminMiddleware.verificarAdmin, adminController.rechazarReporteBan);

// Categorías de Contenido (RA-005)
router.get('/categorias', adminMiddleware.verificarAdmin, adminController.getCategorias);
router.post('/categorias', adminMiddleware.verificarAdmin, adminController.crearCategoria);
router.put('/categorias/:id', adminMiddleware.verificarAdmin, adminController.updateCategoria);
router.delete('/categorias/:id', adminMiddleware.verificarAdmin, adminController.deleteCategoria);

export default router;
