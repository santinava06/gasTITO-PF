import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Fade
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

function ExpenseTable({ gastos, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Alimentos': '#4caf50',
      'Transporte': '#2196f3',
      'Servicios': '#ff9800',
      'Entretenimiento': '#9c27b0',
      'Salud': '#f44336',
      'Educación': '#795548',
      'Ropa': '#607d8b',
      'Hogar': '#8bc34a',
      'Otros': '#9e9e9e'
    };
    return colors[category] || '#9e9e9e';
  };

  return (
    <Fade in={true} timeout={500}>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Lista de gastos
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Tooltip title="Fecha en que se realizó el gasto" arrow>
                  <Typography variant="subtitle2">Fecha</Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="Categoría del gasto" arrow>
                  <Typography variant="subtitle2">Categoría</Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="Descripción detallada del gasto" arrow>
                  <Typography variant="subtitle2">Descripción</Typography>
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Monto gastado" arrow>
                  <Typography variant="subtitle2">Monto</Typography>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Acciones disponibles" arrow>
                  <Typography variant="subtitle2">Acciones</Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gastos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box py={4}>
                    <Typography color="text.secondary">
                      No hay gastos registrados.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Agrega tu primer gasto para comenzar a rastrear tus finanzas.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              gastos.map((gasto, index) => (
                <Fade in={true} timeout={300 + index * 50} key={gasto.id || index}>
                  <TableRow
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'scale(1.01)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    <TableCell>
                      <Tooltip title={formatDate(gasto.fecha)} arrow>
                        <Typography variant="body2">
                          {formatDate(gasto.fecha)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gasto.categoria}
                        size="small"
                        sx={{
                          backgroundColor: getCategoryColor(gasto.categoria) + '20',
                          color: getCategoryColor(gasto.categoria),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={gasto.descripcion} arrow>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {gasto.descripcion}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="primary"
                      >
                        {formatCurrency(gasto.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {onEdit && (
                          <Tooltip title="Editar gasto" arrow>
                            <IconButton
                              color="primary"
                              onClick={() => onEdit(gasto)}
                              size="small"
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'white'
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Eliminar gasto" arrow>
                            <IconButton
                              color="error"
                              onClick={() => onDelete(gasto)}
                              size="small"
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.main',
                                  color: 'white'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            color="info"
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'info.main',
                                color: 'white'
                              }
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </Fade>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Fade>
  );
}

export default ExpenseTable; 