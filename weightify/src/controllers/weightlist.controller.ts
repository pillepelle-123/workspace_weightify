import { Request, Response } from 'express';
import weightlistService from '../services/weightlist.service';
import { Weightlist } from '../models/weightlist.model';
import { Session } from '../models/session.model';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import spotifyService from '../services/spotify.service';

export const createWeightlist = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get user ID from Spotify API
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightlist = await weightlistService.createWeightlist(req.body, userId);
    res.status(201).json(weightlist);
  } catch (error: any) {
    logger.error('Error creating weightlist:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getWeightlist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const weightlist = await Weightlist.findById(id);
    if (!weightlist) {
      return res.status(404).json({ error: 'Weightlist not found' });
    }
    
    res.json(weightlist);
  } catch (error: any) {
    logger.error('Error getting weightlist:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateWeightlist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightlist = await Weightlist.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );
    
    if (!weightlist) {
      return res.status(404).json({ error: 'Weightlist not found' });
    }
    
    res.json(weightlist);
  } catch (error: any) {
    logger.error('Error updating weightlist:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateWeights = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { weights } = req.body;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = 'placeholder-user-id';
    const weightlist = await weightlistService.updateWeights(id, weights, userId);
    res.json(weightlist);
  } catch (error: any) {
    logger.error('Error updating weights:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getNextTrack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = 'placeholder-user-id';
    
    // Get or create session
    let sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      // Start a new playback session
      const { session, firstTrack } = await weightlistService.startPlaybackSession(
        id, 
        userId, 
        accessToken
      );
      
      sessionId = session.sessionId;
      return res.json({ 
        sessionId, 
        track: firstTrack 
      });
    }
    
    // Get next track from existing session
    const track = await weightlistService.getNextTrack(id, sessionId, accessToken);
    res.json({ sessionId, track });
  } catch (error: any) {
    logger.error('Error getting next track:', error);
    res.status(400).json({ error: error.message });
  }
};

export const listTracks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId as string;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = 'placeholder-user-id';
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const tracks = await weightlistService.getAllTracksWithDetails(id, sessionId, accessToken);
    res.json(tracks);
  } catch (error: any) {
    logger.error('Error listing tracks:', error);
    res.status(400).json({ error: error.message });
  }
};

export const resetPlayback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId as string;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = 'placeholder-user-id';
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    await weightlistService.resetPlaybackSession(id, sessionId);
    res.json({ success: true, message: 'Playback session reset successfully' });
  } catch (error: any) {
    logger.error('Error resetting playback:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getUserWeightlists = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get user ID from Spotify API
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightlists = await Weightlist.find({ userId });
    res.json(weightlists);
  } catch (error: any) {
    logger.error('Error getting user weightlists:', error);
    res.status(400).json({ error: error.message });
  }
};