import express from 'express';
import { requireDesarrollador } from '../../developer-auth/middleware/developerAuthMiddleware.js';
import { appItemsController } from '../controllers/appItemsController.js';
import {
  validarCrearItem,
  validarListarItems,
  validarActualizarItem,
  validarEliminarItem,
} from '../validators/appItemsValidator.js';

const router = express.Router();

router.use(requireDesarrollador);

router.get('/app/:appId', validarListarItems, appItemsController.listarItems);
router.post('/app/:appId', validarCrearItem, appItemsController.crearItem);
router.put('/:itemId', validarActualizarItem, appItemsController.actualizarItem);
router.delete('/:itemId', validarEliminarItem, appItemsController.eliminarItem);

export default router;
