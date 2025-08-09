import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { Weightflow, Weightlist } from '../../types';
import { usePlayer } from '../../hooks/usePlayer';
import PlaybackControls from '../player/PlaybackControls';
import TrackList from '../player/TrackList';

interface WeightflowPlayerProps {
  weightflow: Weightflow;
  sessionId: string;
  weightlistDetails: { [key: string]: Weightlist };
  firstTrack: any;
}

const WeightflowPlayer: React.FC<WeightflowPlayerProps> = ({ 
  weightflow, 
  sessionId, 
  weightlistDetails,
  firstTrack 
}) => {
  const player = usePlayer();
  const [currentWeightlistIndex, setCurrentWeightlistIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [switchDialog, setSwitchDialog] = useState<{ open: boolean; targetIndex: number }>({ open: false, targetIndex: 0 });

  const sortedWeightlists = weightflow.weightlists.sort((a, b) => a.order - b.order);
  const currentWeightlist = sortedWeightlists[currentWeightlistIndex];
  const isLastWeightlist = currentWeightlistIndex === sortedWeightlists.length - 1;
  
  // Initialize player with first track (only once)
  useEffect(() => {
    if (firstTrack && currentWeightlist && !player.currentTrack) {
      const weightlistData = weightlistDetails[currentWeightlist.weightlistId];
      if (weightlistData) {
        sessionStorage.setItem('currentWeightflowId', weightflow._id);
        sessionStorage.setItem('currentWeightflowSessionId', sessionId);
        
        // Clear track cache for new session
        const { trackCache } = require('../player/TrackList');
        trackCache.clear();
        
        player.setCurrentWeightlist(weightlistData, sessionId);
        player.playTrack(firstTrack);
      }
    }
  }, [firstTrack, currentWeightlist, sessionId, player, weightlistDetails, weightflow._id]);

  useEffect(() => {
    if (currentWeightlist?.timeLimitMinutes && !isLastWeightlist) {
      setTimeLimitMinutes(currentWeightlist.timeLimitMinutes);
      setTimeRemaining(currentWeightlist.timeLimitMinutes * 60);
    }
  }, [currentWeightlist, isLastWeightlist]);

  useEffect(() => {
    if (timeRemaining > 0 && !isLastWeightlist) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-switch to next weightlist
            if (currentWeightlistIndex < sortedWeightlists.length - 1) {
              setCurrentWeightlistIndex(prev => prev + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isLastWeightlist, currentWeightlistIndex, sortedWeightlists.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTimeLimit = (delta: number) => {
    const newLimit = Math.max(1, Math.min(1440, timeLimitMinutes + delta));
    setTimeLimitMinutes(newLimit);
    
    // Adjust remaining time proportionally
    const ratio = newLimit / (timeLimitMinutes || 1);
    setTimeRemaining(prev => Math.floor(prev * ratio));
  };

  const handleWeightlistClick = (index: number) => {
    if (index !== currentWeightlistIndex) {
      setSwitchDialog({ open: true, targetIndex: index });
    }
  };

  const handleSwitchConfirm = (immediate: boolean) => {
    setCurrentWeightlistIndex(switchDialog.targetIndex);
    setSwitchDialog({ open: false, targetIndex: 0 });
    
    // Reset timer for new weightlist
    const newWeightlist = sortedWeightlists[switchDialog.targetIndex];
    if (newWeightlist?.timeLimitMinutes && switchDialog.targetIndex < sortedWeightlists.length - 1) {
      setTimeLimitMinutes(newWeightlist.timeLimitMinutes);
      setTimeRemaining(newWeightlist.timeLimitMinutes * 60);
    }
  };

  return (
    <Box>
      {/* Weightflow Progress Bar */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {weightflow.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {sortedWeightlists.map((item, index) => {
              const weightlist = weightlistDetails[item.weightlistId];
              const isActive = index === currentWeightlistIndex;
              const isCompleted = index < currentWeightlistIndex;
              
              return (
                <Chip
                  key={item.weightlistId}
                  label={weightlist?.name || `Weightlist ${index + 1}`}
                  color={isActive ? 'primary' : isCompleted ? 'success' : 'default'}
                  variant={isActive ? 'filled' : 'outlined'}
                  onClick={() => handleWeightlistClick(index)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Box>

          {!isLastWeightlist && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                Time remaining: {formatTime(timeRemaining)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => adjustTimeLimit(-1)}>
                  <Remove />
                </IconButton>
                <Typography variant="body2">
                  {timeLimitMinutes} min
                </Typography>
                <IconButton size="small" onClick={() => adjustTimeLimit(1)}>
                  <Add />
                </IconButton>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Current Weightlist Player */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Now Playing: {weightlistDetails[currentWeightlist?.weightlistId]?.name || 'Loading...'}
          </Typography>
          <PlaybackControls />
        </CardContent>
      </Card>
      
      {currentWeightlist && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Track List
            </Typography>
            <TrackList 
              weightlistId={currentWeightlist.weightlistId} 
              sessionId={sessionId} 
            />
          </CardContent>
        </Card>
      )}

      {/* Switch Confirmation Dialog */}
      <Dialog open={switchDialog.open} onClose={() => setSwitchDialog({ open: false, targetIndex: 0 })}>
        <DialogTitle>Switch Weightlist</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to switch to "{weightlistDetails[sortedWeightlists[switchDialog.targetIndex]?.weightlistId]?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchDialog({ open: false, targetIndex: 0 })}>
            Cancel
          </Button>
          <Button onClick={() => handleSwitchConfirm(false)}>
            After Current Song
          </Button>
          <Button onClick={() => handleSwitchConfirm(true)} variant="contained">
            Immediately
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeightflowPlayer;