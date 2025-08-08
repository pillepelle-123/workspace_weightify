import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Slider, 
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { usePlayer } from '../../hooks/usePlayer';
import { resetPlayback } from '../../api/weightlist';
import { getTrackAlbumCover } from '../../api/weightlist';

const PlaybackControls: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    pauseTrack, 
    resumeTrack, 
    nextTrack, 
    setVolume,
    currentWeightlist,
    sessionId,
    crossfadeDuration,
    setCrossfadeDuration
  } = usePlayer();
  
  const [loading, setLoading] = useState(false);
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);
  
  const handleResetPlayback = async () => {
    if (!currentWeightlist || !sessionId) return;
    
    try {
      setLoading(true);
      await resetPlayback(currentWeightlist._id, sessionId);
      // Reload page to restart session
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset playback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCrossfadeChange = (_event: Event, value: number | number[]) => {
    setCrossfadeDuration(value as number);
  };

  // Fetch album cover when track changes
  useEffect(() => {
    const fetchAlbumCover = async () => {
      if (currentTrack?.id) {
        try {
          const coverUrl = await getTrackAlbumCover(currentTrack.id);
          setAlbumCoverUrl(coverUrl);
        } catch (error) {
          console.error('Failed to fetch album cover:', error);
          setAlbumCoverUrl(null);
        }
      }
    };

    fetchAlbumCover();
  }, [currentTrack?.id]);
  
  if (!currentTrack || !currentWeightlist) {
    return (
      <Typography>
        No track is currently playing
      </Typography>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      gap: 3 
    }}>
      <Box sx={{ flex: { xs: '1', md: '0 0 40%' } }}>
        <Card elevation={3}>
          <CardMedia
            component="img"
            height="300"
            image={albumCoverUrl || currentTrack.album?.images?.[0]?.url || '/placeholder.png'}
            alt={currentTrack.album?.name}
          />
          <CardContent>
            <Typography variant="h6" component="div" noWrap>
              {currentTrack.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom noWrap>
              {currentTrack.artists.map(a => a.name).join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Album: {currentTrack.album?.name}
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Playback Controls
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              my: 3
            }}>
              <IconButton 
                onClick={isPlaying ? pauseTrack : resumeTrack}
                color="primary"
                size="large"
                sx={{ mx: 1 }}
              >
                {isPlaying ? 
                  <PauseIcon fontSize="large" /> : 
                  <PlayArrowIcon fontSize="large" />
                }
              </IconButton>
              
              <IconButton 
                onClick={() => nextTrack()}
                color="primary"
                size="large"
                sx={{ mx: 1 }}
              >
                <SkipNextIcon fontSize="large" />
              </IconButton>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Volume
              </Typography>
              <Slider
                value={volume}
                onChange={(_e, value) => setVolume(value as number)}
                aria-label="Volume"
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Crossfade: {crossfadeDuration} seconds
              </Typography>
              <Slider
                value={crossfadeDuration}
                onChange={handleCrossfadeChange}
                aria-label="Crossfade"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={15}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              mb: 3
            }}>
              <Chip 
                icon={<ShuffleIcon />}
                label={currentWeightlist.playbackMode === 'shuffle' ? 'Shuffle On' : 'Original Order'}
                color={currentWeightlist.playbackMode === 'shuffle' ? 'primary' : 'default'}
                variant="outlined"
              />
              
              <Chip 
                icon={currentWeightlist.repeatMode === 'single_song' ? <RepeatOneIcon /> : <RepeatIcon />}
                label={
                  currentWeightlist.repeatMode === 'none' 
                    ? 'No Repeat' 
                    : currentWeightlist.repeatMode === 'entire_weightlist' 
                      ? 'Repeat All' 
                      : 'Repeat One'
                }
                color={currentWeightlist.repeatMode !== 'none' ? 'primary' : 'default'}
                variant="outlined"
              />
              
              {currentWeightlist.singlePlaylistMode && (
                <Chip 
                  label="Single Playlist Mode" 
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={handleResetPlayback}
              disabled={loading}
              fullWidth
            >
              Reset Playback (Mark All Tracks Unplayed)
            </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PlaybackControls;