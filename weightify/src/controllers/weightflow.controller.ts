import { Request, Response } from 'express';
import weightflowService from '../services/weightflow.service';
import spotifyService from '../services/spotify.service';
import logger from '../utils/logger';

export const createWeightflow = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightflow = await weightflowService.createWeightflow(req.body, userId);
    res.status(201).json(weightflow);
  } catch (error: any) {
    logger.error('Error creating weightflow:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getUserWeightflows = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightflows = await weightflowService.getUserWeightflows(userId);
    res.json(weightflows);
  } catch (error: any) {
    logger.error('Error getting user weightflows:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getWeightflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightflow = await weightflowService.getWeightflow(id, userId);
    if (!weightflow) {
      return res.status(404).json({ error: 'Weightflow not found' });
    }
    
    res.json(weightflow);
  } catch (error: any) {
    logger.error('Error getting weightflow:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateWeightflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const weightflow = await weightflowService.updateWeightflow(id, req.body, userId);
    if (!weightflow) {
      return res.status(404).json({ error: 'Weightflow not found' });
    }
    
    res.json(weightflow);
  } catch (error: any) {
    logger.error('Error updating weightflow:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteWeightflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const success = await weightflowService.deleteWeightflow(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Weightflow not found' });
    }
    
    res.json({ success: true, message: 'Weightflow deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting weightflow:', error);
    res.status(400).json({ error: error.message });
  }
};

export const startWeightflowPlayback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userProfile = await spotifyService.getUserProfile(accessToken);
    const userId = userProfile.id;
    
    const { sessionId, firstTrack, weightflow } = await weightflowService.startWeightflowSession(
      id, 
      userId, 
      accessToken
    );
    
    res.json({ sessionId, track: firstTrack, weightflow });
  } catch (error: any) {
    logger.error('Error starting weightflow playback:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getNextWeightflowTrack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessionId = req.query.sessionId as string;
    const accessToken = (req as any).accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const track = await weightflowService.getNextWeightflowTrack(id, sessionId, accessToken);
    res.json({ sessionId, track });
  } catch (error: any) {
    logger.error('Error getting next weightflow track:', error);
    res.status(400).json({ error: error.message });
  }
};