import SpotifyWebApi from 'spotify-web-api-node';
import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Cache setup
const tokenCache = new NodeCache({ stdTTL: 3500 }); // Just under 1 hour

class SpotifyService {
  private spotifyApi: SpotifyWebApi;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
  }

  getAuthorizationUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-modify-playback-state',
      'user-read-playback-state',
      'streaming'
    ];
    
    return this.spotifyApi.createAuthorizeURL(scopes, 'spotify_auth_state');
  }

  async handleCallback(code: string): Promise<any> {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      const { access_token, refresh_token, expires_in } = data.body;
      
      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in
      };
    } catch (error) {
      logger.error('Error in Spotify authorization:', error);
      throw new Error('Failed to authorize with Spotify');
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    this.spotifyApi.setAccessToken(accessToken);
    try {
      const response = await this.spotifyApi.getMe();
      return response.body;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile from Spotify');
    }
  }

  async getUserPlaylists(accessToken: string): Promise<any> {
    this.spotifyApi.setAccessToken(accessToken);
    try {
      // Get the first 50 playlists (can be paginated for more)
      const response = await this.spotifyApi.getUserPlaylists({ limit: 50 });
      return response.body.items;
    } catch (error) {
      logger.error('Error getting user playlists:', error);
      throw new Error('Failed to get user playlists from Spotify');
    }
  }

async getPlaylistTracks(accessToken: string, playlistId: string): Promise<any> {
  this.spotifyApi.setAccessToken(accessToken);
  try {
    const data = await this.spotifyApi.getPlaylistTracks(playlistId);
    return data.body.items.map(item => {
      if (!item.track) {
        // Return a placeholder or skip this item
        return null;
      }
      
      return {
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        artists: item.track.artists,
        album: {
          name: item.track.album.name,
          images: item.track.album.images
        },
        duration_ms: item.track.duration_ms,
        playlistId
      };
    }).filter(track => track !== null); // Remove null entries
  } catch (error) {
    logger.error('Error getting playlist tracks:', error);
    throw new Error('Failed to get playlist tracks from Spotify');
  }
}

  async getPlaylist(accessToken: string, playlistId: string): Promise<any> {
    this.spotifyApi.setAccessToken(accessToken);
    try {
      const response = await this.spotifyApi.getPlaylist(playlistId);
      return response.body;
    } catch (error) {
      logger.error('Error getting playlist details:', error);
      throw new Error('Failed to get playlist details from Spotify');
    }
  }

  async getTrack(accessToken: string, trackId: string): Promise<any> {
    this.spotifyApi.setAccessToken(accessToken);
    try {
      const response = await this.spotifyApi.getTrack(trackId);
      return response.body;
    } catch (error) {
      logger.error('Error getting track details:', error);
      throw new Error('Failed to get track details from Spotify');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.spotifyApi.setRefreshToken(refreshToken);
    try {
      const data = await this.spotifyApi.refreshAccessToken();
      return data.body.access_token;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh Spotify access token');
    }
  }
}

export default new SpotifyService();