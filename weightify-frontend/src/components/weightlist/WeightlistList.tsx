import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import { useUserWeightlists } from '../../hooks/useWeightlist';
import { formatDistanceToNow } from 'date-fns';

const WeightlistList: React.FC = () => {
  const { weightlists, loading, error } = useUserWeightlists();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        {error}
      </Typography>
    );
  }
  
  if (weightlists.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          You don't have any weightlists yet
        </Typography>
        <Button 
          component={RouterLink} 
          to="/weightlists/new" 
          variant="contained" 
          color="primary"
          sx={{ mt: 2 }}
        >
          Create Your First Weightlist
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1">
          My Weightlists
        </Typography>
        
        <Button 
          component={RouterLink} 
          to="/weightlists/new" 
          variant="contained" 
          color="primary"
        >
          Create New Weightlist
        </Button>
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: 3 
      }}>
        {weightlists.map((weightlist) => (
          <Box key={weightlist._id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {weightlist.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created {formatDistanceToNow(new Date(weightlist.createdAt))} ago
                </Typography>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Source Playlists: {weightlist.sourcePlaylists.length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                  <Chip 
                    label={weightlist.playbackMode === 'default' ? 'Original Order' : 'Shuffle'} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                  
                  {weightlist.repeatMode !== 'none' && (
                    <Chip 
                      label={weightlist.repeatMode === 'entire_weightlist' ? 'Repeat All' : 'Repeat One'} 
                      size="small" 
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  
                  {weightlist.singlePlaylistMode && (
                    <Chip 
                      label="Single Playlist Mode" 
                      size="small" 
                      color="info"
                      variant="outlined"
                    />
                  )}
                  
                  {weightlist.crossfadeDuration > 0 && (
                    <Chip 
                      label={`${weightlist.crossfadeDuration}s Crossfade`} 
                      size="small" 
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {weightlist.scheduledWeightChanges && weightlist.scheduledWeightChanges.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Has {weightlist.scheduledWeightChanges.length} scheduled weight changes
                  </Typography>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  component={RouterLink} 
                  to={`/weightlists/${weightlist._id}`}
                  variant="contained" 
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  size="small"
                  fullWidth
                >
                  Play
                </Button>
                
                <Button 
                  component={RouterLink} 
                  to={`/weightlists/${weightlist._id}/edit`}
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  size="small"
                  fullWidth
                >
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WeightlistList;