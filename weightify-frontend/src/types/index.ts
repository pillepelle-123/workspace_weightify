// Authentication types
export interface User {
  id: string;
  display_name: string;
  email: string;
  images?: { url: string }[];
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Spotify API types
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  playlistName?: string;
}

// Weightlist types
export interface SourcePlaylist {
  playlistId: string;
  playlistName?: string;
  weight: number;
}

export interface WeightChange {
  afterMinutes: number;
  newWeights: { playlistId: string; weight: number }[];
}

export interface Weightlist {
  _id: string;
  name: string;
  userId: string;
  sourcePlaylists: SourcePlaylist[];
  scheduledWeightChanges?: WeightChange[];
  playbackMode: 'default' | 'shuffle';
  repeatMode: 'none' | 'entire_weightlist' | 'single_song';
  singlePlaylistMode: boolean;
  crossfadeDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeightlistTrack extends SpotifyTrack {
  isPlayed: boolean;
  playlistId: string;
  weightlistId: string;
  playlistName?: string;
}

// Playback types
export interface PlaybackState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  volume: number;
  currentWeightlist: Weightlist | null;
  sessionId: string | null;
  crossfadeDuration: number;
  playedTracks: string[];
}