import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Slider,
  Grid,
  Avatar
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import { usePlayer } from '../../hooks/usePlayer';
import { getTrackAlbumCover } from '../../api/weightlist';

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    pauseTrack, 
    resumeTrack, 
    nextTrack,
    previousTrack, 
    setVolume,
    trackHistory 
  } = usePlayer();
  
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);
  
  // Fetch album cover when track changes
  useEffect(() => {
    if (currentTrack?.id) {
      getTrackAlbumCover(currentTrack.id)
        .then(setAlbumCoverUrl)
        .catch(() => setAlbumCoverUrl(null));
    }
  }, [currentTrack?.id]);
  
  useEffect(() => {
    // Set up keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar for play/pause
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isPlaying) {
          pauseTrack();
        } else {
          resumeTrack();
        }
      }
      
      // Right arrow for next track
      if (e.code === 'ArrowRight' && e.target === document.body) {
        e.preventDefault();
        nextTrack();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, pauseTrack, resumeTrack, nextTrack]);
  
  if (!currentTrack) {
    return null;
  }
  
  return (
    <Paper 
      elevation={4} 
      sx={{ 
        p: 2, 
        mb: 3, 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Avatar 
          src={albumCoverUrl || undefined} 
          alt={currentTrack.album?.name}
          variant="rounded"
          sx={{ width: 60, height: 60 }}
        />
        
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="subtitle1" noWrap fontWeight="bold">
            {currentTrack.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTrack.album?.name}
          </Typography>
          {currentTrack.playlistName && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Playlist: {currentTrack.playlistName}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={previousTrack}
            color="primary"
            size="large"
            disabled={trackHistory.length === 0}
          >
            <SkipPreviousIcon />
          </IconButton>
          
          <IconButton 
            onClick={isPlaying ? pauseTrack : resumeTrack}
            color="primary"
            size="large"
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          
          <IconButton 
            onClick={() => nextTrack()}
            color="primary"
            size="large"
          >
            <SkipNextIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 150 }}>
          <VolumeDownIcon sx={{ mr: 1 }} />
          <Slider 
            value={volume}
            onChange={(_e, value) => setVolume(value as number)}
            aria-label="Volume"
            min={0}
            max={100}
            size="small"
          />
          <VolumeUpIcon sx={{ ml: 1 }} />
        </Box>
      </Box>
    </Paper>
  );
};

export default Player;