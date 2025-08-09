import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getTracks } from '../../api/weightlist';
import { WeightlistTrack } from '../../types';
import { usePlayer } from '../../hooks/usePlayer';

// Simple cache for track data
export const trackCache = new Map<string, WeightlistTrack[]>();

interface TrackListProps {
  weightlistId: string;
  sessionId: string;
}

const TrackList: React.FC<TrackListProps> = ({ weightlistId, sessionId }) => {
  const [tracks, setTracks] = useState<WeightlistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { playedTracks, playTrack } = usePlayer();
  
  useEffect(() => {
    const cacheKey = `${weightlistId}-${sessionId}`;
    
    // Always fetch fresh data when weightlistId changes
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const data = await getTracks(weightlistId, sessionId);
        setTracks(data);
        trackCache.set(cacheKey, data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tracks:', err);
        setError('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, [weightlistId, sessionId]);
  
  const isTrackPlayed = (trackId: string) => {
    return playedTracks.includes(trackId) || tracks.find(t => t.id === trackId)?.isPlayed;
  };
  
  const handlePlayTrack = (track: WeightlistTrack) => {
    playTrack(track);
  };
  
  const filteredTracks = tracks.filter(track =>
    track.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artists?.some(artist => 
      artist.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error">
        {error}
      </Typography>
    );
  }
  
  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Search tracks or artists"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />
      
      <List>
        {filteredTracks.map((track) => {
          const played = isTrackPlayed(track.id);
          
          return (
            <React.Fragment key={`${track.id}-${track.playlistId}-${Math.random()}`}>
              <ListItem 
                component="div"
                onClick={() => handlePlayTrack(track)}
                sx={{
                  opacity: played ? 0.6 : 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon>
                  <Avatar
                    src={track.album?.images?.[0]?.url}
                    variant="rounded"
                    sx={{ 
                      width: 60, 
                      height: 60,
                      opacity: played ? 0.6 : 1,
                      mr: 2
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={track.name || 'Unknown Track'}
                  secondary={
                    <>
                      {`${track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'} • ${track.album?.name || 'Unknown Album'}`}
                      {track.playlistName && (
                        <Typography component="span" variant="body2" sx={{ fontStyle: 'italic', display: 'block' }}>
                          from {track.playlistName}
                        </Typography>
                      )}
                    </>
                  }
                  primaryTypographyProps={{
                    color: played ? 'text.secondary' : 'text.primary',
                    fontWeight: played ? 'normal' : 'medium'
                  }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
        
        {filteredTracks.length === 0 && (
          <ListItem>
            <ListItemText 
              primary="No tracks found" 
              secondary={searchTerm ? "Try a different search term" : "No tracks available"}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default TrackList;