import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AccountTree } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import WeightifyLogo from './WeightifyLogo';
import WeightlistIcon from './WeightlistIcon';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [weightlistAnchorEl, setWeightlistAnchorEl] = useState<null | HTMLElement>(null);
  const [weightflowAnchorEl, setWeightflowAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleWeightlistMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setWeightlistAnchorEl(event.currentTarget);
  };
  
  const handleWeightlistMenuClose = () => {
    setWeightlistAnchorEl(null);
  };
  
  const handleWeightflowMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setWeightflowAnchorEl(event.currentTarget);
  };
  
  const handleWeightflowMenuClose = () => {
    setWeightflowAnchorEl(null);
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
              onClick={handleWeightlistMenuOpen}
              sx={{ mr: 1 }}
            >
              <WeightlistIcon />
            </IconButton>
            
            <Menu
              anchorEl={weightlistAnchorEl}
              open={Boolean(weightlistAnchorEl)}
              onClose={handleWeightlistMenuClose}
            >
              <MenuItem component={RouterLink} to="/weightlists" onClick={handleWeightlistMenuClose}>
                My Weightlists
              </MenuItem>
              <MenuItem component={RouterLink} to="/weightlists/new" onClick={handleWeightlistMenuClose}>
                New Weightlist
              </MenuItem>
            </Menu>
            
            <IconButton
              color="inherit"
              onClick={handleWeightflowMenuOpen}
              sx={{ mr: 2 }}
            >
              <AccountTree />
            </IconButton>
            
            <Menu
              anchorEl={weightflowAnchorEl}
              open={Boolean(weightflowAnchorEl)}
              onClose={handleWeightflowMenuClose}
            >
              <MenuItem component={RouterLink} to="/weightflows" onClick={handleWeightflowMenuClose}>
                My Weightflows
              </MenuItem>
              <MenuItem component={RouterLink} to="/weightflows/new" onClick={handleWeightflowMenuClose}>
                New Weightflow
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