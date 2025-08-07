import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { getLoginUrl } from '../../api/spotify';

const Login: React.FC = () => {
  const [loginUrl, setLoginUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLoginUrl = async () => {
      try {
        const url = await getLoginUrl();
        setLoginUrl(url);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to get Spotify login URL';
        setError(`Failed to get Spotify login URL: ${errorMessage}`);
        console.error('Login URL fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoginUrl();
  }, []);
  
  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  
  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Test connection successful:', data);
      alert('Connection successful! Check console for details.');
    } catch (err) {
      console.error('Test connection failed:', err);
      alert('Connection failed! Check console for details.');
    }
  };

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Make sure the backend server is running on port 3000
        </Typography>
        <Button 
          variant="outlined" 
          onClick={testConnection}
          sx={{ mt: 2 }}
        >
          Test Connection
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: 600,
          mx: 'auto'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Weightify
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          Create dynamically weighted playlists from your favorite Spotify content.
          Mix different playlists with custom percentage weights to define how often
          songs from each playlist should be played.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            href={loginUrl}
            size="large"
            sx={{ 
              bgcolor: '#1DB954',
              '&:hover': {
                bgcolor: '#1AA34A'
              }
            }}
          >
            Login with Spotify
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;