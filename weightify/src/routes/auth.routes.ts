import { Router } from 'express';
import { getLoginUrl, handleCallback, getCurrentUser, getUserPlaylists } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/login', getLoginUrl);
router.get('/callback', handleCallback);
router.get('/me', authenticateToken, getCurrentUser);
router.get('/playlists', authenticateToken, getUserPlaylists);

export default router;