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

// POST /api/new-app/:appId/pagar - Procesar pago de registro
router.post('/:appId/pagar', validarObtenerAplicacion, newAppController.procesarPago);

export default router;
