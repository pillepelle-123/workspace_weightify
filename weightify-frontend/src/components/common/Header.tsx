import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import WeightifyLogo from './WeightifyLogo';
import WeightlistIcon from './WeightlistIcon';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
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
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ mr: 2 }}
            >
              <WeightlistIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem component={RouterLink} to="/weightlists" onClick={handleMenuClose}>
                My Weightlists
              </MenuItem>
              <MenuItem component={RouterLink} to="/weightlists/new" onClick={handleMenuClose}>
                New Weightlist
              </MenuItem>
            </Menu>
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