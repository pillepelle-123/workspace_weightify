import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  Avatar,
  Fab,
  Slider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { usePlayer } from '../../hooks/usePlayer';
import { getTrackAlbumCover } from '../../api/weightlist';

const MiniPlayer: React.FC = () => {
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchAlbumCover = async () => {
      if (currentTrack?.id) {
        try {
          const coverUrl = await getTrackAlbumCover(currentTrack.id);
          setAlbumCoverUrl(coverUrl);
        } catch (error) {
          setAlbumCoverUrl(null);
        }
      }
    };

    fetchAlbumCover();
  }, [currentTrack?.id]);

  if (!currentTrack) {
    return null;
  }

  const handleCollapse = () => {
    setIsCollapsed(true);
  };

  const handleExpand = () => {
    setIsCollapsed(false);
  };

  return (
    <>
    <Paper 
      elevation={8} 
      sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
        transform: isCollapsed ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <Avatar
        src={albumCoverUrl || currentTrack.album?.images?.[0]?.url}
        sx={{ width: 56, height: 56, mr: 2 }}
      />
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" noWrap>
          {currentTrack.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {currentTrack.artists?.map(a => a.name).join(', ')}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton 
          onClick={previousTrack}
          color="primary"
          disabled={trackHistory.length === 0}
        >
          <SkipPreviousIcon />
        </IconButton>
        
        <IconButton 
          onClick={isPlaying ? pauseTrack : resumeTrack}
          color="primary"
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        
        <IconButton 
          onClick={() => nextTrack()}
          color="primary"
        >
          <SkipNextIcon />
        </IconButton>
        
        <Box sx={{ width: 80, display: 'flex', alignItems: 'center' }}>
          <Slider
            value={volume}
            onChange={(_e, value) => setVolume(value as number)}
            size="small"
            min={0}
            max={100}
          />
        </Box>
        
        <IconButton 
          onClick={handleCollapse}
          color="primary"
        >
          <ExpandLessIcon sx={{ transform: 'rotate(180deg)' }} />
        </IconButton>
      </Box>
    </Paper>
    
    <Fab
      onClick={handleExpand}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        width: 64,
        height: 64,
        opacity: isCollapsed ? 1 : 0,
        transition: isCollapsed 
          ? 'opacity 0.3s ease-in-out 0.2s' 
          : 'opacity 0.1s ease-in-out',
        pointerEvents: isCollapsed ? 'auto' : 'none'
      }}
    >
      <Avatar
        src={albumCoverUrl || currentTrack.album?.images?.[0]?.url}
        sx={{ width: 56, height: 56 }}
      />
    </Fab>
    </>
  );
};

export default MiniPlayer;