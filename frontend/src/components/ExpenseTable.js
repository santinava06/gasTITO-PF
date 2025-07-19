import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ExpenseTable({ gastos, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Lista de gastos
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gastos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">No hay gastos registrados.</TableCell>
            </TableRow>
          ) : (
            gastos.map((gasto, idx) => (
              <TableRow key={gasto.id || idx}>
                <TableCell>{gasto.fecha}</TableCell>
                <TableCell>{gasto.categoria}</TableCell>
                <TableCell>{gasto.descripcion}</TableCell>
                <TableCell align="right">${gasto.monto}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => onEdit && onEdit(gasto)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => onDelete && onDelete(gasto)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ExpenseTable; 