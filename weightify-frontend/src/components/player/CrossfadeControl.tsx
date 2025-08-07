import React from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { usePlayer } from '../../hooks/usePlayer';

const CrossfadeControl: React.FC = () => {
  const { crossfadeDuration, setCrossfadeDuration } = usePlayer();
  
  const handleChange = (_event: Event, value: number | number[]) => {
    setCrossfadeDuration(value as number);
  };
  
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography id="crossfade-slider" gutterBottom>
        Crossfade: {crossfadeDuration} seconds
      </Typography>
      <Slider
        aria-labelledby="crossfade-slider"
        value={crossfadeDuration}
        onChange={handleChange}
        step={1}
        marks
        min={0}
        max={15}
        valueLabelDisplay="auto"
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Set how long tracks will overlap when transitioning
      </Typography>
    </Box>
  );
};

export default CrossfadeControl;