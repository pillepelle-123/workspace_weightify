import React from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import WeightifyLogo from './WeightifyLogo';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ display: 'inline-block' }}>
            <WeightifyLogo />
          </RouterLink>
        </Box>
        
        {isAuthenticated ? (
          <>
            <Button color="inherit" component={RouterLink} to="/weightlists">
              My Weightlists
            </Button>
            <Button color="inherit" component={RouterLink} to="/weightlists/new">
              Create New
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              {user?.images && user.images.length > 0 && (
                <Avatar 
                  src={user.images[0].url} 
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
              )}
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user?.display_name}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </Box>
          </>
        ) : (
          <Button color="inherit" component={RouterLink} to="/login">
            Login with Spotify
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;