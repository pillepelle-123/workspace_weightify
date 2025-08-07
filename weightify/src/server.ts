import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './utils/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDatabase()
  .then(() => {
    // Start the server
    app.listen(PORT, () => {
      console.log(`\n🚀 WEIGHTIFY BACKEND SERVER STARTED ON PORT ${PORT} 🚀`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`📍 Time: ${new Date().toISOString()}`);
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
  });