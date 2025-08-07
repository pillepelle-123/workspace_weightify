import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth middleware - Headers:', req.headers);
  console.log('Auth middleware - Token:', token);

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  // For now, we'll accept any token since we're using Spotify's token
  // In a production app, you'd validate the token here
  (req as any).accessToken = token;
  next();
};