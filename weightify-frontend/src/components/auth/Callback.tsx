import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const Callback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple executions
      if (processed) {
        //console.log('NEW CODE: Already processed, skipping');
        return;
      }
      
      // Only process callback if we're on the callback route
      if (location.pathname !== '/auth/callback') {
        //console.log('NEW CODE: Not on callback route, current path:', location.pathname);
        return;
      }
      
      setProcessed(true);
      
      //console.log('NEW CODE: Full URL:', window.location.href);
      //console.log('NEW CODE: Search params:', location.search);
      const params = new URLSearchParams(location.search);
      const success = params.get('success');
      const error = params.get('error');
      
      //console.log('NEW CODE: Success param:', success);
      //console.log('NEW CODE: Error param:', error);
      //console.log('NEW CODE: All params:', Array.from(params.entries()));
      
      if (error) {
        setError(`Authentication error: ${error}`);
        return;
      }
      
      if (success === 'true') {
        //console.log('NEW CODE: Success detected, reading user data from URL...');
        const userData = params.get('data');
        //console.log('NEW CODE: User data param:', userData);
        
        if (userData) {
          try {
            const { user, accessToken } = JSON.parse(decodeURIComponent(userData));
            console.log('User data:', user);
            login(accessToken, user);
            // Clean up URL and navigate
            setTimeout(() => {
              navigate('/weightlists', { replace: true });
            }, 100);
          } catch (err) {
            console.error('Failed to parse user data:', err);
            setError('Failed to process authentication data');
          }
        } else {
          setError('No user data received');
        }
        return;
      }
      
      setError('Invalid callback parameters');
    };
    
    processCallback();
  }, [location, navigate, login]);
  
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          <a href="/login">Return to login</a>
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      mt: 8 
    }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Authenticating with Spotify...
      </Typography>
    </Box>
  );
};

export default Callback;