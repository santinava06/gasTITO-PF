import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Finanzas Familiares
        </Typography>
        {token ? (
          <Box display="flex" alignItems="center" gap={2}>
            <Button color="inherit" component={Link} to="/">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/groups">
              Grupos
            </Button>
            <Button color="inherit" component={Link} to="/reportes">
              Reportes
            </Button>
            <Typography variant="body1">{user?.email}</Typography>
            <Button color="inherit" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Box>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              Ingresar
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Registrarse
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 