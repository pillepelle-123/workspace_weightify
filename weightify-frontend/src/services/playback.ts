import { SpotifyTrack } from '../types';
import SpotifyPlaybackService from './spotifyPlayback';

class PlaybackService {
  private spotifyPlayer: SpotifyPlaybackService;
  private crossfadeDuration: number = 0;
  private volume: number = 0.5;
  private onEndCallback: (() => void) | null = null;
  private initialized: boolean = false;

  constructor() {
    this.spotifyPlayer = new SpotifyPlaybackService();
  }

  async initialize(accessToken: string): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      await this.spotifyPlayer.initialize(accessToken);
      this.spotifyPlayer.setOnEndCallback(() => {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      });
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Spotify player:', error);
      return false;
    }
  }

  setOnEndCallback(callback: () => void) {
    this.onEndCallback = callback;
  }

  setCrossfadeDuration(seconds: number) {
    // Validate seconds between 0 and 15
    this.crossfadeDuration = Math.max(0, Math.min(15, seconds));
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.spotifyPlayer.setVolume(this.volume);
  }

  async play(track: SpotifyTrack) {
    if (!this.initialized) {
      console.error('Player not initialized');
      return;
    }
    
    try {
      // Wait for player to be ready before playing
      await this.spotifyPlayer.waitForReady();
      await this.spotifyPlayer.play(track);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }

  preloadNextTrack(track: SpotifyTrack) {
    // Spotify Web Playback SDK doesn't support preloading
    console.log(`Next track ready: ${track.name}`);
  }

  async pause() {
    await this.spotifyPlayer.pause();
  }

  async resume() {
    await this.spotifyPlayer.resume();
  }

  async stop() {
    await this.spotifyPlayer.stop();
  }

  async seek(positionMs: number) {
    await this.spotifyPlayer.seek(positionMs);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  disconnect() {
    this.spotifyPlayer.disconnect();
  }
}

export default PlaybackService;