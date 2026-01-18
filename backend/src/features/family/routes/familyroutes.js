import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import { FamilyController } from '../controllers/familycontroller.js';

const router = Router();

// Protege todas las rutas del módulo Family
router.use(requireAuth);

router.post('/create', FamilyController.create);
router.get('/my-family', FamilyController.myFamily);
router.post('/invite', FamilyController.invite);
router.post('/accept', FamilyController.accept);

router.post('/games/lock', FamilyController.lockGame);
router.post('/games/unlock', FamilyController.unlockGame);

export default router;
