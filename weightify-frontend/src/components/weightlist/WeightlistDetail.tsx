import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  Grid,
  Divider,
  Chip,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useSingleWeightlist } from '../../hooks/useWeightlist';
import { usePlayer } from '../../hooks/usePlayer';
import { getNextTrack, getTracks } from '../../api/weightlist';
import { getUserPlaylists } from '../../api/spotify';
import { SpotifyPlaylist } from '../../types';
import TrackList from '../player/TrackList';
import PlaybackControls from '../player/PlaybackControls';
import Player from '../player/Player';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface WeightlistDetailProps {
  weightlistId?: string;
  embedded?: boolean;
  sessionId?: string;
}

const WeightlistDetail: React.FC<WeightlistDetailProps> = ({ 
  weightlistId: propWeightlistId, 
  embedded = false, 
  sessionId: propSessionId 
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propWeightlistId || paramId;
  const navigate = useNavigate();
  const { weightlist, loading, error } = useSingleWeightlist(id || '');
  const player = usePlayer();
  
  const [tabValue, setTabValue] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(propSessionId || null);
  const [playbackStarted, setPlaybackStarted] = useState(embedded && propSessionId ? true : false);

  const [playbackError, setPlaybackError] = useState<string | null>(null);
  

  const [playlistNames, setPlaylistNames] = useState<Record<string, string>>({});
  
  // Auto-start playback for embedded mode
  useEffect(() => {
    if (embedded && propSessionId && weightlist && !playbackStarted) {
      const firstTrack = (window as any).weightflowFirstTrack;
      if (firstTrack) {
        player.setCurrentWeightlist(weightlist, propSessionId);
        player.playTrack(firstTrack);
        setPlaybackStarted(true);
        // Clean up
        delete (window as any).weightflowFirstTrack;
      }
    }
  }, [embedded, propSessionId, weightlist, playbackStarted, player]);
  
  // Preload tracks in background
  useEffect(() => {
    if (sessionId && weightlist) {
      getTracks(weightlist._id, sessionId).catch(err => 
        console.log('Background track loading failed:', err)
      );
    }
  }, [sessionId, weightlist]);
  
  // Fetch playlist names
  useEffect(() => {
    const fetchPlaylistNames = async () => {
      if (!weightlist) return;
      
      try {
        const playlists = await getUserPlaylists();
        const namesMap: Record<string, string> = {};
        
        playlists.forEach((playlist: SpotifyPlaylist) => {
          namesMap[playlist.id] = playlist.name;
        });
        
        setPlaylistNames(namesMap);
      } catch (error) {
        console.error('Failed to fetch playlist names:', error);
      }
    };
    
    fetchPlaylistNames();
  }, [weightlist]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const startPlayback = async () => {
    if (!weightlist) return;
    
    try {
      setPlaybackError(null);
      
      // Get the first track and start a new session
      const result = await getNextTrack(weightlist._id);
      
      setSessionId(result.sessionId);
      player.setCurrentWeightlist(weightlist, result.sessionId);
      player.playTrack(result.track);
      setPlaybackStarted(true);
    } catch (err) {
      console.error('Failed to start playback:', err);
      setPlaybackError('Failed to start playback. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !weightlist) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">
          {error || 'Weightlist not found'}
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/weightlists')}
          sx={{ mt: 2 }}
        >
          Back to Weightlists
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {!embedded && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/weightlists')}
          >
            Back to Weightlists
          </Button>
          
          <Button 
            startIcon={<EditIcon />}
            variant="outlined"
            component="a"
            href={`/weightlists/${weightlist._id}/edit`}
          >
            Edit Weightlist
          </Button>
        </Box>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {weightlist.name}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Chip 
            label={weightlist.playbackMode === 'default' ? 'Original Order' : 'Shuffle'} 
            color="primary"
          />
          
          <Chip 
            label={
              weightlist.repeatMode === 'none' 
                ? 'No Repeat' 
                : weightlist.repeatMode === 'entire_weightlist' 
                  ? 'Repeat All' 
                  : 'Repeat One'
            } 
            color="secondary"
          />
          
          {weightlist.singlePlaylistMode && (
            <Chip 
              label="Single Playlist Mode" 
              color="info"
            />
          )}
          
          <Chip 
            label={`${weightlist.crossfadeDuration}s Crossfade`} 
            color="success"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(50% - 8px)' } }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Source Playlists
            </Typography>
            
            {weightlist.sourcePlaylists.map((playlist) => (
              <Box 
                key={playlist.playlistId} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1
                }}
              >
                <Typography variant="body2">
                  {playlistNames[playlist.playlistId] || playlist.playlistId}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {playlist.weight}%
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(50% - 8px)' } }}>
            {weightlist.scheduledWeightChanges && weightlist.scheduledWeightChanges.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Scheduled Weight Changes
                </Typography>
                
                {weightlist.scheduledWeightChanges.map((change, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      After {change.afterMinutes} minutes:
                    </Typography>
                    
                    {change.newWeights.map((weight) => (
                      <Box 
                        key={weight.playlistId} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          ml: 2
                        }}
                      >
                        <Typography variant="body2">
                          {playlistNames[weight.playlistId] || weight.playlistId}
                        </Typography>
                        <Typography variant="body2">
                          {weight.weight}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
        
        {!embedded && !playbackStarted && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            {playbackError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {playbackError}
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={startPlayback}
            >
              Start Playback
            </Button>
          </Box>
        )}
      </Paper>
      
      {(playbackStarted || embedded) && (
        <>
          {/* <Player /> */}
          
          <Paper elevation={3} sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              centered
              variant="fullWidth"
            >
              <Tab label="Now Playing" />
              <Tab label="Track List" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <PlaybackControls />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {sessionId && (
                <TrackList weightlistId={weightlist._id} sessionId={sessionId} />
              )}
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default WeightlistDetail;