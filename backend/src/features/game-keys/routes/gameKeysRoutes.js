import express from 'express';
import { gameKeysController } from '../controllers/gameKeysController.js';
import { requireDesarrollador } from '../../developer-auth/middleware/developerAuthMiddleware.js';
import {
  validarCrearLlave,
  validarListarLlaves,
  validarDesactivarLlave
} from '../validators/gameKeysValidator.js';

const router = express.Router();

router.use(requireDesarrollador);

router.post('/:juegoId', validarCrearLlave, gameKeysController.crearLlave);
router.get('/:juegoId', validarListarLlaves, gameKeysController.listarLlaves);
router.delete('/:llaveId', validarDesactivarLlave, gameKeysController.desactivarLlave);
router.get('/estadisticas/general', gameKeysController.obtenerEstadisticas);

export default router;
