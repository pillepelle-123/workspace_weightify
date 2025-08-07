import React from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  Paper, 
  Avatar, 
  IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { SpotifyPlaylist, SourcePlaylist } from '../../types';

interface PlaylistWeightProps {
  sourcePlaylist: SourcePlaylist;
  playlistInfo: SpotifyPlaylist;
  onWeightChange: (playlistId: string, weight: number) => void;
  onRemove: (playlistId: string) => void;
}

const PlaylistWeight: React.FC<PlaylistWeightProps> = ({
  sourcePlaylist,
  playlistInfo,
  onWeightChange,
  onRemove
}) => {
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    onWeightChange(sourcePlaylist.playlistId, newValue as number);
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Avatar 
          src={playlistInfo.images[0]?.url}
          alt={playlistInfo.name}
          variant="rounded"
          sx={{ width: 56, height: 56 }}
        />
        
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {playlistInfo.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {playlistInfo.tracks.total} tracks • By {playlistInfo.owner.display_name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200, flex: 1 }}>
          <Box sx={{ width: '100%', mr: 2 }}>
            <Slider
              value={sourcePlaylist.weight}
              onChange={handleSliderChange}
              aria-labelledby="playlist-weight-slider"
              valueLabelDisplay="auto"
              step={1}
              min={0}
              max={100}
            />
          </Box>
          <Box sx={{ minWidth: 60 }}>
            <Typography variant="body2">{sourcePlaylist.weight}%</Typography>
          </Box>
        </Box>
        
        <IconButton 
          aria-label="delete" 
          onClick={() => onRemove(sourcePlaylist.playlistId)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default PlaylistWeight;