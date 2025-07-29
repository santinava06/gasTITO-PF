import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Box,
  CircularProgress,
  Button,
  Fade,
  Slide
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';

const LazyMembersList = ({ members, getInitials, onLoadMore, hasMore = false, loading = false }) => {
  const [displayedMembers, setDisplayedMembers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const ITEMS_PER_BATCH = 6; // Cargar 6 miembros por vez

  // Cargar miembros iniciales
  useEffect(() => {
    if (members.length > 0) {
      const initialBatch = members.slice(0, ITEMS_PER_BATCH);
      setDisplayedMembers(initialBatch);
      setCurrentIndex(ITEMS_PER_BATCH);
    }
  }, [members]);

  // Función para cargar más miembros
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    // Simular delay para mostrar loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const nextBatch = members.slice(currentIndex, currentIndex + ITEMS_PER_BATCH);
    setDisplayedMembers(prev => [...prev, ...nextBatch]);
    setCurrentIndex(prev => prev + ITEMS_PER_BATCH);
    
    setIsLoadingMore(false);
  }, [currentIndex, members, hasMore, isLoadingMore]);

  // Función para cargar más desde el servidor si es necesario
  const handleServerLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error cargando más miembros:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (members.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          No hay miembros en este grupo.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {displayedMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Slide in={true} timeout={300 + index * 100} direction="up">
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getInitials(member.email)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {member.name || member.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role === 'owner' ? 'Propietario' : 
                         member.role === 'admin' ? 'Administrador' : 'Miembro'}
                      </Typography>
                    </Box>
                    <Chip
                      label={member.role === 'owner' ? 'Propietario' : 
                             member.role === 'admin' ? 'Admin' : 'Miembro'}
                      color={member.role === 'owner' ? 'error' : 
                             member.role === 'admin' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Miembro desde: {new Date(member.joinedAt).toLocaleDateString('es-ES')}
                  </Typography>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        ))}
      </Grid>

      {/* Botón para cargar más */}
      {(hasMore || currentIndex < members.length) && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="outlined"
            onClick={currentIndex < members.length ? handleLoadMore : handleServerLoadMore}
            disabled={isLoadingMore}
            startIcon={isLoadingMore ? <CircularProgress size={16} /> : <PeopleIcon />}
          >
            {isLoadingMore ? 'Cargando...' : 'Cargar más miembros'}
          </Button>
        </Box>
      )}

      {/* Información de paginación */}
      <Box textAlign="center" mt={2}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {displayedMembers.length} de {members.length} miembros
        </Typography>
      </Box>
    </Box>
  );
};

export default LazyMembersList; 