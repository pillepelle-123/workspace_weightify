import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Slider,
  Alert
} from '@mui/material';
import PlaylistSelector from '../playlist/PlaylistSelector';
import PlaylistWeight from '../playlist/PlaylistWeight';
import { SpotifyPlaylist, SourcePlaylist } from '../../types';
import { getUserPlaylists } from '../../api/spotify';
import { createWeightlist, getWeightlist, updateWeightlist, deleteWeightlist } from '../../api/weightlist';

const WeightlistForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [name, setName] = useState('');
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [sourcePlaylists, setSourcePlaylists] = useState<SourcePlaylist[]>([]);
  const [playbackMode, setPlaybackMode] = useState<'default' | 'shuffle'>('default');
  const [repeatMode, setRepeatMode] = useState<'none' | 'entire_weightlist' | 'single_song'>('none');
  const [singlePlaylistMode, setSinglePlaylistMode] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(0);
  
  const [playlistsInfo, setPlaylistsInfo] = useState<Record<string, SpotifyPlaylist>>({});
  const [totalWeight, setTotalWeight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Load playlist details and existing weightlist data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allPlaylists = await getUserPlaylists();
        const playlistsMap: Record<string, SpotifyPlaylist> = {};
        
        allPlaylists.forEach(playlist => {
          playlistsMap[playlist.id] = playlist;
        });
        
        setPlaylistsInfo(playlistsMap);
        
        // Load existing weightlist data if in edit mode
        if (isEditMode && id) {
          const weightlist = await getWeightlist(id);
          setName(weightlist.name);
          setPlaybackMode(weightlist.playbackMode);
          setRepeatMode(weightlist.repeatMode);
          setSinglePlaylistMode(weightlist.singlePlaylistMode);
          setCrossfadeDuration(weightlist.crossfadeDuration);
          
          const playlistIds = weightlist.sourcePlaylists.map(p => p.playlistId);
          setSelectedPlaylists(playlistIds);
          
          const sourcePlaylistsWithNames = weightlist.sourcePlaylists.map(p => ({
            ...p,
            playlistName: playlistsMap[p.playlistId]?.name || 'Unknown Playlist'
          }));
          setSourcePlaylists(sourcePlaylistsWithNames);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      }
    };
    
    fetchData();
  }, [isEditMode, id]);
  
  // Update source playlists when selection changes
  useEffect(() => {
    const existingIds = sourcePlaylists.map(p => p.playlistId);
    
    // Remove deselected playlists
    const filteredPlaylists = sourcePlaylists.filter(p => 
      selectedPlaylists.includes(p.playlistId)
    );
    
    // Add newly selected playlists
    const newPlaylists = selectedPlaylists
      .filter(id => !existingIds.includes(id))
      .map(id => ({
        playlistId: id,
        playlistName: playlistsInfo[id]?.name || 'Unknown Playlist',
        weight: 0
      }));
    
    const updatedPlaylists = [...filteredPlaylists, ...newPlaylists];
    
    // If this is the first playlist, give it 100% weight
    if (updatedPlaylists.length === 1 && newPlaylists.length === 1) {
      updatedPlaylists[0].weight = 100;
    }
    
    setSourcePlaylists(updatedPlaylists);
  }, [selectedPlaylists, playlistsInfo]);
  
  // Calculate total weight
  useEffect(() => {
    const total = sourcePlaylists.reduce((sum, playlist) => sum + playlist.weight, 0);
    setTotalWeight(total);
  }, [sourcePlaylists]);
  
  const handlePlaylistSelect = (playlistIds: string[]) => {
    setSelectedPlaylists(playlistIds);
  };
  
  const handleWeightChange = (playlistId: string, weight: number) => {
    setSourcePlaylists(prev => 
      prev.map(p => 
        p.playlistId === playlistId ? { ...p, weight } : p
      )
    );
  };
  
  const handleRemovePlaylist = (playlistId: string) => {
    setSelectedPlaylists(prev => prev.filter(id => id !== playlistId));
  };
  
  const distributeRemainingWeight = () => {
    // Only distribute if we have more than one playlist
    if (sourcePlaylists.length <= 1) return;
    
    const remaining = 100 - totalWeight;
    if (remaining === 0) return;
    
    const perPlaylistAdjustment = remaining / sourcePlaylists.length;
    
    setSourcePlaylists(prev => 
      prev.map(p => ({
        ...p,
        weight: Math.max(0, Math.round(p.weight + perPlaylistAdjustment))
      }))
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name for your weightlist');
      return;
    }
    
    if (sourcePlaylists.length === 0) {
      setError('Please select at least one playlist');
      return;
    }
    
    if (Math.abs(totalWeight - 100) > 1) {
      setError('Total weight must equal 100%');
      return;
    }
    
    // Normalize weights to ensure they sum to exactly 100%
    const normalizedPlaylists = [...sourcePlaylists];
    const sum = normalizedPlaylists.reduce((s, p) => s + p.weight, 0);
    
    if (sum !== 100) {
      // Find the playlist with the highest weight to adjust
      let maxIndex = 0;
      for (let i = 1; i < normalizedPlaylists.length; i++) {
        if (normalizedPlaylists[i].weight > normalizedPlaylists[maxIndex].weight) {
          maxIndex = i;
        }
      }
      normalizedPlaylists[maxIndex].weight += (100 - sum);
    }
    
    try {
      setLoading(true);
      
      const weightlistData = {
        name,
        sourcePlaylists: normalizedPlaylists.map(p => ({
          playlistId: p.playlistId,
          weight: p.weight
        })),
        playbackMode,
        repeatMode,
        singlePlaylistMode,
        crossfadeDuration
      };
      
      let result;
      if (isEditMode && id) {
        result = await updateWeightlist(id, weightlistData);
      } else {
        result = await createWeightlist(weightlistData);
      }
      
      navigate(`/weightlists/${result._id}`);
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} weightlist:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} weightlist`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await deleteWeightlist(id);
      navigate('/weightlists');
    } catch (err) {
      console.error('Failed to delete weightlist:', err);
      setError('Failed to delete weightlist');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Weightlist' : 'New Weightlist'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        <TextField
          fullWidth
          label="Weightlist Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          margin="normal"
        />
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
          gap: 3, 
          mt: 2 
        }}>
          <FormControl fullWidth>
            <InputLabel id="playback-mode-label">Playback Mode</InputLabel>
            <Select
              labelId="playback-mode-label"
              value={playbackMode}
              label="Playback Mode"
              onChange={(e) => setPlaybackMode(e.target.value as 'default' | 'shuffle')}
            >
              <MenuItem value="default">Default (Original Order)</MenuItem>
              <MenuItem value="shuffle">Shuffle</MenuItem>
            </Select>
            <FormHelperText>How tracks are ordered during playback</FormHelperText>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="repeat-mode-label">Repeat Mode</InputLabel>
            <Select
              labelId="repeat-mode-label"
              value={repeatMode}
              label="Repeat Mode"
              onChange={(e) => setRepeatMode(e.target.value as 'none' | 'entire_weightlist' | 'single_song')}
            >
              <MenuItem value="none">No Repeat</MenuItem>
              <MenuItem value="entire_weightlist">Repeat Entire Weightlist</MenuItem>
              <MenuItem value="single_song">Repeat Single Song</MenuItem>
            </Select>
            <FormHelperText>How playback repeats after completion</FormHelperText>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="single-playlist-mode-label">Single Playlist Mode</InputLabel>
            <Select
              labelId="single-playlist-mode-label"
              value={singlePlaylistMode ? 'true' : 'false'}
              label="Single Playlist Mode"
              onChange={(e) => setSinglePlaylistMode(e.target.value === 'true')}
            >
              <MenuItem value="false">Disabled</MenuItem>
              <MenuItem value="true">Enabled</MenuItem>
            </Select>
            <FormHelperText>Play only from one source playlist at a time</FormHelperText>
          </FormControl>
          
          <Box>
            <Typography gutterBottom>
              Crossfade Duration: {crossfadeDuration} seconds
            </Typography>
            <Slider
              value={crossfadeDuration}
              onChange={(_e, value) => setCrossfadeDuration(value as number)}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={15}
              aria-labelledby="crossfade-slider"
            />
            <FormHelperText>Set crossfade duration between tracks (0-15 seconds)</FormHelperText>
          </Box>
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Playlists
        </Typography>
        
        <PlaylistSelector 
          selectedPlaylists={selectedPlaylists}
          onPlaylistSelect={handlePlaylistSelect}
        />
      </Paper>
      
      {selectedPlaylists.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6">
              Playlist Weights
            </Typography>
            
            <Box>
              <Typography 
                variant="body1" 
                color={Math.abs(totalWeight - 100) <= 1 ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                Total: {totalWeight}%
              </Typography>
              
              {Math.abs(totalWeight - 100) > 1 && (
                <Button 
                  size="small" 
                  onClick={distributeRemainingWeight}
                  variant="outlined"
                  sx={{ ml: 2 }}
                >
                  Auto Adjust
                </Button>
              )}
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {sourcePlaylists.map((sourcePlaylist) => (
            playlistsInfo[sourcePlaylist.playlistId] && (
              <PlaylistWeight
                key={sourcePlaylist.playlistId}
                sourcePlaylist={sourcePlaylist}
                playlistInfo={playlistsInfo[sourcePlaylist.playlistId]}
                onWeightChange={handleWeightChange}
                onRemove={handleRemovePlaylist}
              />
            )
          ))}
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {isEditMode && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => showDeleteConfirm ? handleDelete() : setShowDeleteConfirm(true)}
              disabled={loading}
              sx={showDeleteConfirm ? {
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: '#fff'
                }
              } : {}}
            >
              {showDeleteConfirm ? 'Confirm Deletion' : 'Delete Weightlist'}
            </Button>
            {showDeleteConfirm && (
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel Deletion
              </Button>
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex' }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => navigate('/weightlists')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading || sourcePlaylists.length === 0 || Math.abs(totalWeight - 100) > 1}
          >
            {isEditMode ? 'Update Weightlist' : 'Create Weightlist'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WeightlistForm;