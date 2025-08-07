import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
  };



  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          SnackDonald's
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Menu */}
          <Button color="inherit" onClick={() => navigate('/')}>
            Menu
          </Button>

          {/* Cart */}
          <IconButton color="inherit" onClick={() => navigate('/cart')}>
            <Badge badgeContent={0} color="secondary">
              <CartIcon />
            </Badge>
          </IconButton>

          {/* Reviews */}
          <Button color="inherit" onClick={() => navigate('/reviews')}>
            Reviews
          </Button>

          {/* Admin Menu */}
          {user?.is_superuser || user?.cafe_manager ? (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/dashboard"
                sx={{ textTransform: 'none' }}
              >
                DASHBOARD
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-tables"
                sx={{ textTransform: 'none' }}
              >
                TABLES
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-rooms"
                sx={{ textTransform: 'none' }}
              >
                ROOMS
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-floors"
                sx={{ textTransform: 'none' }}
              >
                FLOORS
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-staff"
                sx={{ textTransform: 'none' }}
              >
                STAFF
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-menu"
                sx={{ textTransform: 'none' }}
              >
                MENU
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/staff-portal"
                sx={{ textTransform: 'none' }}
              >
                STAFF PORTAL
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/admin-hr"
                sx={{ textTransform: 'none' }}
              >
                HR ADMIN
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/manage-orders"
                sx={{ textTransform: 'none' }}
              >
                ORDERS
              </Button>
            </>
          ) : null}

          {/* User Menu */}
          {user ? (
            <>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <PersonIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { navigate('/my-orders'); handleClose(); }}>
                  My Orders
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
