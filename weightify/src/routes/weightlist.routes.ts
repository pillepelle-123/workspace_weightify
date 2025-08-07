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

const getAlbumCover = async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const track = await spotifyService.getTrack(accessToken, trackId);
    const albumCoverUrl = track.album?.images?.[0]?.url || null;
    
    res.json({ albumCoverUrl });
  } catch (error: any) {
    logger.error('Error getting album cover:', error);
    res.status(400).json({ error: error.message });
  }
};

router.get('/tracks/:trackId/album-cover', getAlbumCover);

export default router;
