import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import spotifyService from '../services/spotify.service';
import logger from '../utils/logger';

const router = Router();

router.use(authenticateToken);

const getAlbumCover = async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;
    const accessToken = (req as any).accessToken;
    
    const track = await spotifyService.getTrack(accessToken, trackId);
    const albumCoverUrl = track.album?.images?.[0]?.url || null;
    
    res.json({ albumCoverUrl });
  } catch (error: any) {
    logger.error('Error getting album cover:', error);
    res.status(404).json({ error: 'Track not found' });
  }
};

router.get('/:trackId/album-cover', getAlbumCover);

export default router;