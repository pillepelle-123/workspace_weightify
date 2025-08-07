import { useContext, useEffect, useCallback } from 'react';
import { PlayerContext } from '../contexts/PlayerContext';
import { getNextTrack } from '../api/weightlist';

export const usePlayer = () => {
  const playerContext = useContext(PlayerContext);
  
  const handleTrackEnd = useCallback(async () => {
    if (!playerContext.currentWeightlist || !playerContext.sessionId) return;
    
    try {
      const result = await getNextTrack(
        playerContext.currentWeightlist._id, 
        playerContext.sessionId
      );
      
      if (result.track) {
        playerContext.playTrack(result.track);
      }
    } catch (error) {
      console.error('Error getting next track:', error);
    }
  }, [playerContext]);
  
  // Set up track end handler
  useEffect(() => {
    // This would set up the callback on the playback service
    // In a real implementation, you would register this with the PlaybackService
    // playbackService.setOnEndCallback(handleTrackEnd);
    
    return () => {
      // Clean up
      // playbackService.setOnEndCallback(null);
    };
  }, [handleTrackEnd]);
  
  return playerContext;
};