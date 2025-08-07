import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { PlaybackState, SpotifyTrack, Weightlist } from '../types';
import PlaybackService from '../services/playback';
import { getNextTrack, resetPlayback as resetPlaybackAPI } from '../api/weightlist';
import { useAuth } from '../hooks/useAuth';

interface PlayerContextType extends PlaybackState {
  playTrack: (track: SpotifyTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => Promise<void>;
  resetPlayback: () => Promise<void>;
  setCurrentWeightlist: (weightlist: Weightlist, sessionId: string) => void;
  setCrossfadeDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  stopPlayback: () => void;
}

const initialState: PlaybackState = {
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  currentWeightlist: null,
  sessionId: null,
  crossfadeDuration: 0,
  playedTracks: []
};

type PlayerAction = 
  | { type: 'SET_TRACK'; payload: SpotifyTrack }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_WEIGHTLIST'; payload: { weightlist: Weightlist; sessionId: string } }
  | { type: 'SET_CROSSFADE'; payload: number }
  | { type: 'MARK_PLAYED'; payload: string }
  | { type: 'RESET_PLAYED' };

const playerReducer = (state: PlaybackState, action: PlayerAction): PlaybackState => {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true
      };
    case 'PLAY':
      return {
        ...state,
        isPlaying: true
      };
    case 'PAUSE':
      return {
        ...state,
        isPlaying: false
      };
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload
      };
    case 'SET_WEIGHTLIST':
      return {
        ...state,
        currentWeightlist: action.payload.weightlist,
        sessionId: action.payload.sessionId,
        playedTracks: []
      };
    case 'SET_CROSSFADE':
      return {
        ...state,
        crossfadeDuration: action.payload
      };
    case 'MARK_PLAYED':
      return {
        ...state,
        playedTracks: [...state.playedTracks, action.payload]
      };
    case 'RESET_PLAYED':
      return {
        ...state,
        playedTracks: []
      };
    default:
      return state;
  }
};

export const PlayerContext = createContext<PlayerContextType>({
  ...initialState,
  playTrack: () => {},
  pauseTrack: () => {},
  resumeTrack: () => {},
  nextTrack: async () => {},
  resetPlayback: async () => {},
  setCurrentWeightlist: () => {},
  setCrossfadeDuration: () => {},
  setVolume: () => {},
  stopPlayback: () => {}
});

// Create singleton playback service
const playbackService = new PlaybackService();

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const { accessToken } = useAuth();

  // Initialize Spotify player when access token is available
  useEffect(() => {
    if (accessToken) {
      playbackService.initialize(accessToken).then((success) => {
        if (success) {
          console.log('Spotify player initialized successfully');
        }
      });
    }
  }, [accessToken]);

  // Set up auto-advance callback
  useEffect(() => {
    playbackService.setOnEndCallback(() => {
      nextTrack();
    });
  }, []);

  // Set up playback service with initial state
  playbackService.setCrossfadeDuration(state.crossfadeDuration);
  playbackService.setVolume(state.volume / 100); // Convert to 0-1 range

  const playTrack = (track: SpotifyTrack) => {
    playbackService.play(track);
    dispatch({ type: 'SET_TRACK', payload: track });
    dispatch({ type: 'MARK_PLAYED', payload: track.id });
  };

  const pauseTrack = () => {
    playbackService.pause();
    dispatch({ type: 'PAUSE' });
  };
  
  const stopPlayback = () => {
    playbackService.stop();
    dispatch({ type: 'PAUSE' });
  };

  const resumeTrack = () => {
    if (state.currentTrack) {
      playbackService.resume();
      dispatch({ type: 'PLAY' });
    }
  };

  const nextTrack = async () => {
    if (!state.currentWeightlist || !state.sessionId) return;
    
    try {
      const { track } = await getNextTrack(state.currentWeightlist._id, state.sessionId);
      if (track) {
        playTrack(track);
      }
    } catch (error) {
      console.error('Error getting next track:', error);
    }
  };

  const resetPlayback = async () => {
    if (!state.currentWeightlist || !state.sessionId) return;
    
    try {
      await resetPlaybackAPI(state.currentWeightlist._id, state.sessionId);
      dispatch({ type: 'RESET_PLAYED' });
    } catch (error) {
      console.error('Error resetting playback:', error);
    }
  };

  const setCurrentWeightlist = (weightlist: Weightlist, sessionId: string) => {
    dispatch({ 
      type: 'SET_WEIGHTLIST', 
      payload: { weightlist, sessionId } 
    });
    
    // Update crossfade duration based on weightlist settings
    setCrossfadeDuration(weightlist.crossfadeDuration);
  };

  const setCrossfadeDuration = (duration: number) => {
    playbackService.setCrossfadeDuration(duration);
    dispatch({ type: 'SET_CROSSFADE', payload: duration });
  };

  const setVolume = (volume: number) => {
    playbackService.setVolume(volume / 100); // Convert to 0-1 range
    dispatch({ type: 'SET_VOLUME', payload: volume });
  };

  return (
    <PlayerContext.Provider value={{
      ...state,
      playTrack,
      pauseTrack,
      resumeTrack,
      nextTrack,
      resetPlayback,
      setCurrentWeightlist,
      setCrossfadeDuration,
      setVolume,
      stopPlayback
    }}>
      {children}
    </PlayerContext.Provider>
  );
};