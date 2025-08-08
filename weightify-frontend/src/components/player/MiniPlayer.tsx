import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  Avatar
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { usePlayer } from '../../hooks/usePlayer';
import { getTrackAlbumCover } from '../../api/weightlist';

const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    pauseTrack, 
    resumeTrack, 
    nextTrack 
  } = usePlayer();
  
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);

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

  return (
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
        zIndex: 1000
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
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
      </Box>
    </Paper>
  );
};

export default MiniPlayer;