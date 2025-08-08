import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import MiniPlayer from '../player/MiniPlayer';
import { usePlayer } from '../../hooks/usePlayer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTrack } = usePlayer();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      pb: currentTrack ? '80px' : 0 // Space for mini player when expanded
    }}>
      <CssBaseline />
      <Header />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
      <Footer />
      <MiniPlayer />
    </Box>
  );
};

export default Layout;