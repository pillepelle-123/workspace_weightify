# Weightify

Weightify is a Node.js application that uses the Spotify Web API to create dynamically weighted playlists ("Weightlists").

## Features

- **Weightlists**: Combine multiple Spotify playlists with percentage weights
- **Weighted Playback**: Songs are selected based on source playlist weights
- **Dynamic Weight Adjustments**: Schedule weight changes over time
- **Playback Modes**: Default order, shuffle, repeat, single playlist mode
- **Track Management**: Mark played tracks to avoid repeats within a session
- **Crossfade**: Smooth transitions between tracks

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Spotify Developer Account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/weightify.git
   cd weightify
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/weightify
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
   SESSION_SECRET=your_random_secret
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## API Endpoints

- **Authentication**
  - `GET /auth/login` - Get Spotify login URL
  - `GET /auth/callback` - Handle Spotify OAuth callback
  - `GET /auth/playlists` - Get user's Spotify playlists

- **Weightlists**
  - `POST /api/weightlists` - Create a new weightlist
  - `GET /api/weightlists` - Get user's weightlists
  - `PUT /api/weightlists/:id/weights` - Update weightlist weights
  - `GET /api/weightlists/:id/play` - Get next track (weighted)
  - `GET /api/weightlists/:id/tracks` - List all tracks
  - `PUT /api/weightlists/:id/reset` - Reset playback session

## License

MIT
```

## 17. Package scripts

Update your package.json scripts section for easier management:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon --exec ts-node src/server.ts",
    "lint": "eslint --ext .ts src/",
    "test": "jest",
    "db:seed": "ts-node src/utils/seedDatabase.ts"
  }
}