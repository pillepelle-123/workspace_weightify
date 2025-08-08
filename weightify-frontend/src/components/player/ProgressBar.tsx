import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface ProgressBarProps {
  currentPosition: number;
  duration: number;
  size?: 'small' | 'medium';
  onSeek?: (position: number) => void;
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentPosition, 
  duration, 
  size = 'medium',
  onSeek
}) => {
  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <Typography variant={size === 'small' ? 'caption' : 'body2'} sx={{ minWidth: '35px' }}>
        {formatTime(currentPosition)}
      </Typography>
      
      <Box 
        sx={{ 
          flex: 1, 
          cursor: onSeek ? 'pointer' : 'default'
        }}
        onClick={(e) => {
          if (onSeek && duration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newPosition = Math.max(0, Math.min(duration, percentage * duration));
            onSeek(newPosition);
          }
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ 
            height: size === 'small' ? 4 : 6,
            borderRadius: 2
          }}
        />
      </Box>
      
      <Typography variant={size === 'small' ? 'caption' : 'body2'} sx={{ minWidth: '35px' }}>
        {formatTime(duration)}
      </Typography>
    </Box>
  );
};

export default ProgressBar;