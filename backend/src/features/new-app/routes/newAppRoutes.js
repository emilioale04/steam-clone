/**
 * Rutas de Gestión de Nuevas Aplicaciones
 * Feature: Creación de Nueva Aplicación (RF-004)
 */

import express from 'express';
import multer from 'multer';
import { newAppController } from '../controllers/newAppController.js';
import { requireDesarrollador } from '../../developer-auth/middleware/developerAuthMiddleware.js';
import {
  validarCrearAplicacion,
  validarActualizarAplicacion,
  validarObtenerAplicacion
} from '../validators/newAppValidator.js';

const router = express.Router();

// Configuración de multer para manejar subida de archivos
// Los archivos se guardan en memoria temporalmente
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300 MB máximo (C13)
    files: 2 // Máximo 2 archivos (build + portada)
  }
});

// Middleware de autenticación de desarrollador en todas las rutas
router.use(requireDesarrollador);

// GET /api/new-app/categorias - Obtener categorías de contenido
router.get('/categorias', newAppController.obtenerCategorias);

// POST /api/new-app - Crear nueva aplicación
router.post(
  '/',
  upload.fields([
    { name: 'build_file', maxCount: 1 },
    { name: 'portada_file', maxCount: 1 }
  ]),
  validarCrearAplicacion,
  newAppController.crearAplicacion
);

// GET /api/new-app - Listar todas las aplicaciones del desarrollador
router.get('/', newAppController.listarAplicaciones);

// GET /api/new-app/:appId - Obtener una aplicación específica
router.get('/:appId', validarObtenerAplicacion, newAppController.obtenerAplicacion);

// PUT /api/new-app/:appId - Actualizar una aplicación
router.put(
  '/:appId',
  upload.fields([
    { name: 'build_file', maxCount: 1 },
    { name: 'portada_file', maxCount: 1 }
  ]),
  validarActualizarAplicacion,
  newAppController.actualizarAplicacion
);

// PUT /api/new-app/:appId/etiquetas - Actualizar etiquetas de la aplicación
router.put('/:appId/etiquetas', validarObtenerAplicacion, newAppController.actualizarEtiquetas);

// PUT /api/new-app/:appId/precio - Actualizar precio de la aplicación
router.put('/:appId/precio', validarObtenerAplicacion, newAppController.actualizarPrecio);

// PUT /api/new-app/:appId/descripcion - Actualizar descripción larga de la aplicación
router.put('/:appId/descripcion', validarObtenerAplicacion, newAppController.actualizarDescripcion);

// POST /api/new-app/:appId/pagar - Procesar pago de registro
router.post('/:appId/pagar', validarObtenerAplicacion, newAppController.procesarPago);

// ==================== RESEÑAS ====================

// GET /api/new-app/:appId/resenias - Obtener reseñas de la aplicación
router.get('/:appId/resenias', validarObtenerAplicacion, newAppController.obtenerResenias);

// POST /api/new-app/:appId/resenias/:resenaId/responder - Responder a una reseña
router.post('/:appId/resenias/:resenaId/responder', validarObtenerAplicacion, newAppController.responderResenia);

// ==================== ANUNCIOS ====================

// GET /api/new-app/:appId/anuncios - Obtener anuncios de la aplicación
router.get('/:appId/anuncios', validarObtenerAplicacion, newAppController.obtenerAnuncios);

// POST /api/new-app/:appId/anuncios - Crear un nuevo anuncio
router.post('/:appId/anuncios', validarObtenerAplicacion, newAppController.crearAnuncio);

// DELETE /api/new-app/:appId/anuncios/:anuncioId - Eliminar un anuncio
router.delete('/:appId/anuncios/:anuncioId', validarObtenerAplicacion, newAppController.eliminarAnuncio);

export default router;
