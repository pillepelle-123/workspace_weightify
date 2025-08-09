import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as weightflowController from '../controllers/weightflow.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', weightflowController.createWeightflow);
router.get('/', weightflowController.getUserWeightflows);
router.get('/:id', weightflowController.getWeightflow);
router.put('/:id', weightflowController.updateWeightflow);
router.delete('/:id', weightflowController.deleteWeightflow);
router.post('/:id/play', weightflowController.startWeightflowPlayback);
router.get('/:id/next', weightflowController.getNextWeightflowTrack);

export default router;