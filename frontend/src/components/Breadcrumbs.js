import React from 'react';
import { 
  Breadcrumbs as MuiBreadcrumbs, 
  Link, 
  Typography, 
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function Breadcrumbs() {
  const navigate = useNavigate();
  const location = useLocation();

  // Generar breadcrumbs basado en la ruta actual
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [];

    // Agregar Home como primer breadcrumb
    breadcrumbs.push({
      name: 'Inicio',
      path: '/',
      icon: <HomeIcon fontSize="small" />
    });

    // Construir breadcrumbs dinámicamente
    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Mapear nombres de rutas a nombres legibles
      let displayName = name;
      let icon = null;
      
      switch (name) {
        case 'groups':
          displayName = 'Grupos';
          icon = <HomeIcon fontSize="small" />;
          break;
        case 'expenses':
          displayName = 'Gastos';
          icon = <HomeIcon fontSize="small" />;
          break;
        case 'reportes':
          displayName = 'Reportes';
          icon = <HomeIcon fontSize="small" />;
          break;
        case 'login':
          displayName = 'Iniciar Sesión';
          icon = <HomeIcon fontSize="small" />;
          break;
        case 'register':
          displayName = 'Registrarse';
          icon = <HomeIcon fontSize="small" />;
          break;
        default:
          // Si es un ID (número), mostrar información contextual
          if (!isNaN(name)) {
            displayName = `ID: ${name}`;
          }
          break;
      }

      breadcrumbs.push({
        name: displayName,
        path: currentPath,
        icon
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // No mostrar breadcrumbs en la página de inicio
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Botón Volver */}
      <Tooltip title="Volver">
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.paper', boxShadow: 2 }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Breadcrumbs */}
      <MuiBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ 
          flex: 1,
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return isLast ? (
            <Typography
              key={breadcrumb.path}
              color="text.primary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontWeight: 600 
              }}
            >
              {breadcrumb.icon}
              {breadcrumb.name}
            </Typography>
          ) : (
            <Link
              key={breadcrumb.path}
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(breadcrumb.path);
              }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {breadcrumb.icon}
              {breadcrumb.name}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}

export default Breadcrumbs; 