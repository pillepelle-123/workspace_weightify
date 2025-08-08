import { Request, Response, NextFunction } from 'express';
import spotifyService from '../services/spotify.service';
import logger from '../utils/logger';
import User from '../models/user.model';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Validate token by making a test call to Spotify
    const userProfile = await spotifyService.getUserProfile(token);
    (req as any).accessToken = token;
    (req as any).userId = userProfile.id;
    next();
  } catch (error: any) {
    logger.error('Token validation failed:', error);
    
    try {
      // Try to get user profile to find user ID for refresh
      const userProfile = await spotifyService.getUserProfile(token);
      const user = await User.findOne({ spotifyId: userProfile.id });
      
      if (user?.refreshToken) {
        const newAccessToken = await spotifyService.refreshAccessToken(user.refreshToken);
        
        // Update user with new token
        user.accessToken = newAccessToken;
        user.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
        await user.save();
        
        (req as any).accessToken = newAccessToken;
        (req as any).userId = user.spotifyId;
        res.setHeader('X-New-Access-Token', newAccessToken);
        next();
      } else {
        return res.status(401).json({ error: 'Token expired, please login again' });
      }
    } catch (refreshError) {
      // Token completely invalid, try to find user by stored token
      try {
        const user = await User.findOne({ accessToken: token });
        if (user?.refreshToken) {
          const newAccessToken = await spotifyService.refreshAccessToken(user.refreshToken);
          
          user.accessToken = newAccessToken;
          user.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
          await user.save();
          
          (req as any).accessToken = newAccessToken;
          (req as any).userId = user.spotifyId;
          res.setHeader('X-New-Access-Token', newAccessToken);
          next();
        } else {
          return res.status(401).json({ error: 'Token expired, please login again' });
        }
      } catch (finalError) {
        logger.error('All token refresh attempts failed:', finalError);
        return res.status(401).json({ error: 'Token expired, please login again' });
      }
    }
  }
};