import { SpotifyTrack } from '../types';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

class SpotifyPlaybackService {
  private player: any = null;
  private deviceId: string = '';
  private accessToken: string = '';
  private onEndCallback: (() => void) | null = null;

  async initialize(accessToken: string): Promise<boolean> {
    this.accessToken = accessToken;

    return new Promise((resolve) => {
      // Define the callback immediately
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.setupPlayer();
        resolve(true);
      };

      // If Spotify is already loaded, call it directly
      if (window.Spotify) {
        window.onSpotifyWebPlaybackSDKReady();
      }
    });
  }

  private setupPlayer() {
    this.player = new window.Spotify.Player({
      name: 'Weightify Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken);
      },
      volume: 0.5
    });

    // Error handling
    this.player.addListener('initialization_error', ({ message }: any) => {
      console.error('Failed to initialize:', message);
    });

    this.player.addListener('authentication_error', ({ message }: any) => {
      console.error('Failed to authenticate:', message);
    });

    this.player.addListener('account_error', ({ message }: any) => {
      console.error('Failed to validate Spotify account:', message);
    });

    this.player.addListener('playback_error', ({ message }: any) => {
      console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    this.player.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      // Track ended when position is 0 and paused, or when position equals duration
      if (state.position === 0 && state.paused && state.track_window.current_track) {
        // Track ended, call callback
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    });

    // Ready
    this.player.addListener('ready', ({ device_id }: any) => {
      console.log('Ready with Device ID', device_id);
      this.deviceId = device_id;
    });

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }: any) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    this.player.connect();
  }

  setOnEndCallback(callback: () => void) {
    this.onEndCallback = callback;
  }

  async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.deviceId) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('Player initialization timeout'));
      }, 10000); // 10 second timeout
      
      const checkReady = () => {
        if (this.deviceId) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    });
  }

  async play(track: SpotifyTrack) {
    if (!this.deviceId) {
      console.error('Device not ready');
      return;
    }

    try {
      // Transfer playback to our device and play the track
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [track.uri]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
      });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

  async pause() {
    if (this.player) {
      await this.player.pause();
    }
  }

  async resume() {
    if (this.player) {
      await this.player.resume();
    }
  }

  async stop() {
    if (this.player && this.deviceId) {
      try {
        // Stop playback by making an empty play request
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${this.deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
        });
      } catch (error) {
        console.error('Error stopping playback:', error);
      }
    }
  }

  setVolume(volume: number) {
    if (this.player) {
      this.player.setVolume(volume);
    }
  }

  async seek(positionMs: number) {
    if (this.player) {
      await this.player.seek(positionMs);
    }
  }

  disconnect() {
    if (this.player) {
      this.player.disconnect();
    }
  }
}

export default SpotifyPlaybackService;