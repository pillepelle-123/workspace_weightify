import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import MiniPlayer from '../player/MiniPlayer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      pb: '80px' // Space for mini player
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