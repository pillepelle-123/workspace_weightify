import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Checkbox, 
  TextField, 
  CircularProgress 
} from '@mui/material';
import { SpotifyPlaylist } from '../../types';
import { getUserPlaylists } from '../../api/spotify';

interface PlaylistSelectorProps {
  selectedPlaylists: string[];
  onPlaylistSelect: (playlistIds: string[]) => void;
}

const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({ 
  selectedPlaylists, 
  onPlaylistSelect 
}) => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const data = await getUserPlaylists();
        setPlaylists(data);
      } catch (err) {
        console.error('Failed to fetch playlists:', err);
        setError('Failed to load your Spotify playlists');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylists();
  }, []);
  
  const handleToggle = (playlistId: string) => {
    const newSelected = selectedPlaylists.includes(playlistId)
      ? selectedPlaylists.filter(id => id !== playlistId)
      : [...selectedPlaylists, playlistId];
    
    onPlaylistSelect(newSelected);
  };
  
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <TextField
        fullWidth
        label="Search playlists"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        margin="normal"
      />
      
      <List sx={{ 
        width: '100%', 
        bgcolor: 'background.paper',
        maxHeight: 400,
        overflow: 'auto'
      }}>
        {filteredPlaylists.map((playlist) => {
          const isSelected = selectedPlaylists.includes(playlist.id);
          
          return (
            <ListItem 
              key={playlist.id} 
              component="div"
              onClick={() => handleToggle(playlist.id)}
              sx={{
                bgcolor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <Checkbox
                edge="start"
                checked={isSelected}
                tabIndex={-1}
                disableRipple
              />
              <ListItemAvatar>
                <Avatar 
                  src={playlist.images?.[0]?.url} 
                  alt={playlist.name}
                  variant="rounded"
                />
              </ListItemAvatar>
              <ListItemText 
                primary={playlist.name}
                secondary={`${playlist.tracks.total} tracks • By ${playlist.owner.display_name}`}
              />
            </ListItem>
          );
        })}
        
        {filteredPlaylists.length === 0 && (
          <ListItem>
            <ListItemText primary="No playlists found" />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default PlaylistSelector;