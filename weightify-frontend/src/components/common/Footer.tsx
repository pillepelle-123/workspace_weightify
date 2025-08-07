import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ 
      py: 3, 
      px: 2, 
      mt: 'auto',
      backgroundColor: (theme) => theme.palette.grey[200] 
    }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Weightify - Create weighted Spotify playlists
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        Powered by{' '}
        <Link color="inherit" href="https://developer.spotify.com/documentation/web-api/">
          Spotify Web API
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;