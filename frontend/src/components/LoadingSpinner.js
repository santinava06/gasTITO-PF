import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Fade,
  Skeleton,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Loading spinner con mensaje personalizado
export function LoadingSpinner({ message = 'Cargando...', size = 'large' }) {
  const iconSize = size === 'large' ? 64 : size === 'medium' ? 48 : 32;
  const progressSize = size === 'large' ? 60 : size === 'medium' ? 40 : 24;

  return (
    <Fade in={true} timeout={500}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        gap={2}
      >
        <CircularProgress 
          size={progressSize} 
          thickness={4}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}

// Skeleton loader para contenido
export function ContentSkeleton({ type = 'default', count = 3 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
          </Paper>
        );
      
      case 'table':
        return (
          <Box>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
            {Array.from({ length: count }).map((_, index) => (
              <Skeleton 
                key={index} 
                variant="rectangular" 
                height={52} 
                sx={{ mb: 0.5 }} 
              />
            ))}
          </Box>
        );
      
      case 'list':
        return (
          <Box>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
              </Box>
            ))}
          </Box>
        );
      
      default:
        return (
          <Box>
            <Skeleton variant="text" width="100%" height={32} />
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
        );
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Box>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index}>
            {renderSkeleton()}
          </Box>
        ))}
      </Box>
    </Fade>
  );
}

// Loading específico para diferentes secciones
export function SectionLoading({ section = 'default' }) {
  const getSectionConfig = () => {
    switch (section) {
      case 'dashboard':
        return {
          icon: <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
          message: 'Cargando dashboard...',
          description: 'Preparando tus estadísticas'
        };
      
      case 'groups':
        return {
          icon: <GroupIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
          message: 'Cargando grupos...',
          description: 'Obteniendo tus grupos de gastos'
        };
      
      case 'reports':
        return {
          icon: <AssessmentIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
          message: 'Generando reportes...',
          description: 'Procesando tus datos'
        };
      
      default:
        return {
          icon: <CircularProgress size={64} />,
          message: 'Cargando...',
          description: 'Por favor espera'
        };
    }
  };

  const config = getSectionConfig();

  return (
    <Fade in={true} timeout={500}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={3}
      >
        <Box
          sx={{
            animation: 'bounce 2s ease-in-out infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateY(0)',
              },
              '40%': {
                transform: 'translateY(-10px)',
              },
              '60%': {
                transform: 'translateY(-5px)',
              },
            },
          }}
        >
          {config.icon}
        </Box>
        
        <Box textAlign="center">
          <Typography 
            variant="h6" 
            color="text.primary"
            sx={{ mb: 1 }}
          >
            {config.message}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
          >
            {config.description}
          </Typography>
        </Box>
        
        <CircularProgress 
          size={40} 
          thickness={4}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </Box>
    </Fade>
  );
}

// Loading overlay para acciones
export function ActionLoading({ open, message = 'Procesando...' }) {
  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgcolor="rgba(0, 0, 0, 0.5)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
      >
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            minWidth: 200,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.primary">
            {message}
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );
} 