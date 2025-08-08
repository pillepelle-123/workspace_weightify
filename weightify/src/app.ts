/// <reference path="./types/express-session.d.ts" />
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import weightlistRoutes from './routes/weightlist.routes';
import tracksRoutes from './routes/tracks.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Request logging
app.use(requestLogger);

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/weightlists', weightlistRoutes);
app.use('/api/tracks', tracksRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Weightify API' });
});

// Error handling
app.use(errorHandler);

export default app;