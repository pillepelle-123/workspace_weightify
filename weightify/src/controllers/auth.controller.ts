import { Request, Response } from 'express';
import spotifyService from '../services/spotify.service';
import logger from '../utils/logger';
import User from '../models/user.model';

export const getLoginUrl = (req: Request, res: Response) => {
  try {
    const authUrl = spotifyService.getAuthorizationUrl();
    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  try {
    const tokens = await spotifyService.handleCallback(code);
    
    // Get user profile
    const userProfile = await spotifyService.getUserProfile(tokens.accessToken);
    
    // Store/update user in database
    await User.findOneAndUpdate(
      { spotifyId: userProfile.id },
      {
        spotifyId: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.display_name,
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
      },
      { upsert: true, new: true }
    );
    
    // Store minimal data in session
    req.session.userId = userProfile.id;
    
    // Redirect to frontend with user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const userData = encodeURIComponent(JSON.stringify({
      user: userProfile,
      accessToken: tokens.accessToken
    }));
    res.redirect(`${frontendUrl}/auth/callback?success=true&data=${userData}`);
  } catch (error) {
    logger.error('Auth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const accessToken = req.session.accessToken;
  const userId = req.session.userId;
  
  if (!accessToken || !userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await spotifyService.getUserProfile(accessToken);
    res.json({ 
      user,
      accessToken,
      userId 
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  const accessToken = (req as any).accessToken;
  
  try {
    const user = await spotifyService.getUserProfile(accessToken);
    res.json({ 
      user,
      accessToken,
      valid: true
    });
  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const getUserPlaylists = async (req: Request, res: Response) => {
  const accessToken = (req as any).accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const playlists = await spotifyService.getUserPlaylists(accessToken);
    res.json(playlists);
  } catch (error) {
    logger.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};