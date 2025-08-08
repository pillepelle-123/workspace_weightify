import { Router, Request, Response } from 'express';
import { 
  createWeightlist,
  getWeightlist,
  updateWeightlist,
  updateWeights,
  getNextTrack,
  listTracks,
  resetPlayback,
  getUserWeightlists
} from '../controllers/weightlist.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import spotifyService from '../services/spotify.service';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post('/', createWeightlist);
router.get('/:id', getWeightlist);
router.put('/:id', updateWeightlist);
router.put('/:id/weights', updateWeights);
router.get('/:id/play', getNextTrack);
router.get('/:id/tracks', listTracks);
router.put('/:id/reset', resetPlayback);
router.get('/', getUserWeightlists);



export default router;
