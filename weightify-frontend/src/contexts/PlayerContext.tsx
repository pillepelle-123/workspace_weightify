import React, { createContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { PlaybackState, SpotifyTrack, Weightlist } from '../types';
import PlaybackService from '../services/playback';
import { getNextTrack, resetPlayback as resetPlaybackAPI } from '../api/weightlist';
import { useAuth } from '../hooks/useAuth';

interface PlayerContextType extends PlaybackState {
  playTrack: (track: SpotifyTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => void;
  resetPlayback: () => Promise<void>;
  resetPlayer: () => void;
  setCurrentWeightlist: (weightlist: Weightlist, sessionId: string) => void;
  setCrossfadeDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  stopPlayback: () => void;
  seekTo: (position: number) => void;
}

const initialState: PlaybackState = {
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  currentWeightlist: null,
  sessionId: null,
  crossfadeDuration: 0,
  playedTracks: [],
  trackHistory: [],
  currentPosition: 0,
  duration: 0
};

type PlayerAction = 
  | { type: 'SET_TRACK'; payload: SpotifyTrack }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_WEIGHTLIST'; payload: { weightlist: Weightlist; sessionId: string } }
  | { type: 'SET_CROSSFADE'; payload: number }
  | { type: 'MARK_PLAYED'; payload: string }
  | { type: 'RESET_PLAYED' }
  | { type: 'RESET_PLAYER' }
  | { type: 'ADD_TO_HISTORY'; payload: SpotifyTrack }
  | { type: 'UPDATE_PROGRESS'; payload: number };

const playerReducer = (state: PlaybackState, action: PlayerAction): PlaybackState => {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true,
        currentPosition: 0,
        duration: action.payload.duration_ms || 0
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
        playedTracks: [],
        trackHistory: []
      };
    case 'RESET_PLAYER':
      return {
        ...initialState,
        volume: state.volume
      };
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        trackHistory: [...state.trackHistory, action.payload].slice(-10) // Keep last 10 tracks
      };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        currentPosition: action.payload
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
  previousTrack: () => {},
  resetPlayback: async () => {},
  resetPlayer: () => {},
  setCurrentWeightlist: () => {},
  setCrossfadeDuration: () => {},
  setVolume: () => {},
  stopPlayback: () => {},
  seekTo: () => {}
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



  // Update progress every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isPlaying && state.currentTrack) {
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: Math.min(state.currentPosition + 1000, state.duration)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isPlaying, state.currentPosition, state.duration]);

  // Set up playback service with initial state
  playbackService.setCrossfadeDuration(state.crossfadeDuration);
  playbackService.setVolume(state.volume / 100); // Convert to 0-1 range

  const playTrack = (track: SpotifyTrack) => {
    if (state.currentTrack) {
      dispatch({ type: 'ADD_TO_HISTORY', payload: state.currentTrack });
    }
    
    // Ensure player is initialized before playing
    if (!playbackService.isInitialized()) {
      console.log('Player not ready, retrying in 500ms...');
      setTimeout(() => playTrack(track), 500);
      return;
    }
    
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
      const weightflowId = sessionStorage.getItem('currentWeightflowId');
      
      if (weightflowId) {
        const { weightflowApi } = await import('../api/weightflow');
        const { track } = await weightflowApi.getNextTrack(weightflowId, state.sessionId);
        if (track) {
          playTrack(track);
        }
      } else {
        const { track } = await getNextTrack(state.currentWeightlist._id, state.sessionId);
        if (track) {
          playTrack(track);
        }
      }
    } catch (error) {
      console.error('Error getting next track:', error);
    }
  };

  // Set up auto-advance callback
  useEffect(() => {
    let isAdvancing = false;
    playbackService.setOnEndCallback(async () => {
      if (isAdvancing) return;
      isAdvancing = true;
      try {
        // Check if weightflow switch is pending
        const switchPending = sessionStorage.getItem('weightflowSwitchPending');
        const nextIndex = sessionStorage.getItem('weightflowNextIndex');
        const weightflowId = sessionStorage.getItem('currentWeightflowId');
        
        if (switchPending === 'true' && nextIndex && weightflowId) {
          // Clear flags
          sessionStorage.removeItem('weightflowSwitchPending');
          sessionStorage.removeItem('weightflowNextIndex');
          
          // Get weightflow data
          const { weightflowApi } = await import('../api/weightflow');
          const weightflow = await weightflowApi.getWeightflow(weightflowId);
          const nextWeightlist = weightflow.weightlists.find(w => w.order === parseInt(nextIndex));
          
          if (nextWeightlist) {
            // Reset player and navigate
            playbackService.stop();
            dispatch({ type: 'RESET_PLAYER' });
            window.location.href = `/weightlists/${nextWeightlist.weightlistId}?weightflowId=${weightflowId}&weightflowIndex=${nextIndex}`;
            return;
          }
        }
        
        await nextTrack();
      } finally {
        setTimeout(() => { isAdvancing = false; }, 1000);
      }
    });
  }, [nextTrack]);

  const previousTrack = () => {
    if (state.trackHistory.length > 0) {
      const lastTrack = state.trackHistory[state.trackHistory.length - 1];
      
      playbackService.play(lastTrack);
      dispatch({ type: 'SET_TRACK', payload: lastTrack });
      // Remove the last track from history without adding current track back
      dispatch({ type: 'ADD_TO_HISTORY', payload: state.currentTrack! });
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

  const seekTo = (position: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: position });
    playbackService.seek(position);
  };

  const resetPlayer = () => {
    playbackService.stop();
    dispatch({ type: 'RESET_PLAYER' });
  };

  return (
    <PlayerContext.Provider value={{
      ...state,
      playTrack,
      pauseTrack,
      resumeTrack,
      nextTrack,
      previousTrack,
      resetPlayback,
      resetPlayer,
      setCurrentWeightlist,
      setCrossfadeDuration,
      setVolume,
      stopPlayback,
      seekTo
    }}>
      {children}
    </PlayerContext.Provider>
  );
};