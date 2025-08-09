import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Remove, Pause, PlayArrow } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useSingleWeightlist } from '../../hooks/useWeightlist';
import { usePlayer } from '../../hooks/usePlayer';
import { getNextTrack, getTracks } from '../../api/weightlist';
import { getUserPlaylists } from '../../api/spotify';
import { weightflowApi } from '../../api/weightflow';
import { SpotifyPlaylist, Weightflow } from '../../types';
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
  const [searchParams] = useSearchParams();
  const id = propWeightlistId || paramId;
  const navigate = useNavigate();
  const { weightlist, loading, error } = useSingleWeightlist(id || '');
  const player = usePlayer();
  
  // Weightflow context
  const weightflowId = searchParams.get('weightflowId');
  const weightflowIndex = parseInt(searchParams.get('weightflowIndex') || '0');
  const [weightflow, setWeightflow] = useState<Weightflow | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [switchDialog, setSwitchDialog] = useState<{ open: boolean; targetIndex: number }>({ open: false, targetIndex: 0 });
  
  const [tabValue, setTabValue] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(propSessionId || null);
  const [playbackStarted, setPlaybackStarted] = useState(embedded && propSessionId ? true : false);
  const [isStartingPlayback, setIsStartingPlayback] = useState(false);

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
  
  // Load weightflow if in weightflow context
  useEffect(() => {
    if (weightflowId) {
      weightflowApi.getWeightflow(weightflowId).then(setWeightflow);
    }
  }, [weightflowId]);

  // Setup timer for weightflow
  useEffect(() => {
    if (weightflow && weightflowIndex < weightflow.weightlists.length - 1) {
      const currentWeightlist = weightflow.weightlists.find(w => w.order === weightflowIndex);
      if (currentWeightlist?.timeLimitMinutes) {
        setTimeLimitMinutes(currentWeightlist.timeLimitMinutes);
        setTimeRemaining(currentWeightlist.timeLimitMinutes * 60);
      }
    }
  }, [weightflow, weightflowIndex]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && weightflow && weightflowIndex < weightflow.weightlists.length - 1 && !timerPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Mark for switch after current track ends
            sessionStorage.setItem('weightflowSwitchPending', 'true');
            sessionStorage.setItem('weightflowNextIndex', String(weightflowIndex + 1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, weightflow, weightflowIndex, timerPaused]);

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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTimeLimit = (delta: number) => {
    const newLimit = Math.max(1, Math.min(1440, timeLimitMinutes + delta));
    setTimeLimitMinutes(newLimit);
    
    const ratio = newLimit / (timeLimitMinutes || 1);
    setTimeRemaining(prev => Math.floor(prev * ratio));
  };

  const handleWeightlistClick = (index: number) => {
    if (index !== weightflowIndex) {
      setSwitchDialog({ open: true, targetIndex: index });
    }
  };

  const handleSwitchConfirm = (immediate: boolean) => {
    const targetWeightlist = weightflow?.weightlists.find(w => w.order === switchDialog.targetIndex);
    if (targetWeightlist && weightflowId) {
      if (immediate) {
        // Reset player and navigate immediately
        player.resetPlayer();
        window.location.href = `/weightlists/${targetWeightlist.weightlistId}?weightflowId=${weightflowId}&weightflowIndex=${switchDialog.targetIndex}`;
      } else {
        // Mark for switch after current track ends
        sessionStorage.setItem('weightflowSwitchPending', 'true');
        sessionStorage.setItem('weightflowNextIndex', String(switchDialog.targetIndex));
      }
    }
    setSwitchDialog({ open: false, targetIndex: 0 });
  };

  const startPlayback = async (retryCount = 0) => {
    if (!weightlist) return;
    
    try {
      if (retryCount === 0) setIsStartingPlayback(true);
      setPlaybackError(null);
      
      // Get the first track and start a new session
      const result = await getNextTrack(weightlist._id);
      
      setSessionId(result.sessionId);
      player.setCurrentWeightlist(weightlist, result.sessionId);
      player.playTrack(result.track);
      setPlaybackStarted(true);
      setIsStartingPlayback(false);
    } catch (err) {
      console.error('Failed to start playback:', err);
      
      // Retry up to 2 times with increasing delay
      if (retryCount < 2) {
        setTimeout(() => {
          startPlayback(retryCount + 1);
        }, (retryCount + 1) * 500);
      } else {
        setPlaybackError('Failed to start playback. Please try again.');
        setIsStartingPlayback(false);
      }
    }
  };

  // Auto-start playback for weightflow context
  useEffect(() => {
    if (weightflowId && weightlist && !playbackStarted) {
      setIsStartingPlayback(true);
      // Delay to ensure player is initialized
      const timer = setTimeout(() => {
        startPlayback();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [weightflowId, weightlist, playbackStarted]);
  
  if (loading || (weightflowId && isStartingPlayback)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
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
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
      
      {/* Weightflow Progress Bar */}
      {weightflow && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {weightflow.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {weightflow.weightlists.sort((a, b) => a.order - b.order).map((item, index) => {
                const isActive = index === weightflowIndex;
                const isCompleted = index < weightflowIndex;
                const weightlistName = playlistNames[item.weightlistId] || `Weightlist ${index + 1}`;
                
                return (
                  <Chip
                    key={item.weightlistId}
                    label={weightlistName}
                    color={isActive ? 'primary' : isCompleted ? 'success' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    onClick={() => handleWeightlistClick(index)}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Box>

            {weightflowIndex < weightflow.weightlists.length - 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  Time remaining: <span style={{ 
                    color: timeRemaining === 0 ? 'red' : 'inherit',
                    animation: timeRemaining === 0 ? 'blink 1s infinite' : 'none'
                  }}>{formatTime(timeRemaining)}</span>
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => setTimerPaused(!timerPaused)}>
                    {timerPaused ? <PlayArrow /> : <Pause />}
                  </IconButton>
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
      )}

      {!embedded && !weightflow && (
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
            
            {isStartingPlayback ? (
              <CircularProgress size={40} />
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => startPlayback()}
              >
                Start Playback
              </Button>
            )}
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

      {/* Switch Confirmation Dialog */}
      <Dialog open={switchDialog.open} onClose={() => setSwitchDialog({ open: false, targetIndex: 0 })}>
        <DialogTitle>Switch Weightlist</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to switch to the selected weightlist?
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

export default WeightlistDetail;