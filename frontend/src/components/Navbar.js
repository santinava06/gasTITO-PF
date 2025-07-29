import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Typography, Box, Avatar, IconButton, Menu, MenuItem, Divider, Tooltip, useTheme, alpha
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../context/AuthContext';

function stringAvatar(email) {
  if (!email) return '';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return initials.toUpperCase();
}

function Navbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={3}
      sx={{
        background: `rgba(30, 41, 59, 0.85)`,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
      }}
    >
      <Toolbar>
        {/* Navegación */}
        {token ? (
          <Box display="flex" alignItems="center" gap={1} flexGrow={1}>
            <Tooltip title="Dashboard" arrow>
              <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<DashboardIcon />}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2, transition: 'background 0.2s', '&:hover': { background: alpha(theme.palette.primary.light, 0.15) } }}
              >
                Dashboard
              </Button>
            </Tooltip>
            <Tooltip title="Grupos" arrow>
              <Button
                color="inherit"
                component={Link}
                to="/groups"
                startIcon={<GroupsIcon />}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2, transition: 'background 0.2s', '&:hover': { background: alpha(theme.palette.primary.light, 0.15) } }}
              >
                Grupos
              </Button>
            </Tooltip>
            <Tooltip title="Reportes" arrow>
              <Button
                color="inherit"
                component={Link}
                to="/reportes"
                startIcon={<AssessmentIcon />}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2, transition: 'background 0.2s', '&:hover': { background: alpha(theme.palette.primary.light, 0.15) } }}
              >
                Reportes
              </Button>
            </Tooltip>
            <Box flexGrow={1} />
            {/* Avatar usuario */}
            <Tooltip title={user?.email || ''} arrow>
              <IconButton onClick={handleAvatarClick} size="small" sx={{
                ml: 1,
                border: `2px solid ${theme.palette.secondary.main}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.18)}`,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.08)' }
              }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  {stringAvatar(user?.email)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box px={2} py={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1} flexGrow={1} justifyContent="flex-end">
            <Button
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
              sx={{ fontWeight: 600, borderRadius: 2, px: 2 }}
            >
              Ingresar
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/register"
              startIcon={<PersonAddIcon />}
              sx={{ fontWeight: 600, borderRadius: 2, px: 2 }}
            >
              Registrarse
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 