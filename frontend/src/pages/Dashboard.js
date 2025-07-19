import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseTable from '../components/ExpenseTable';
import { fetchExpenses, addExpense, deleteExpense, updateExpense } from '../services/expenses';

function Dashboard() {
  const [open, setOpen] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [gastoEdit, setGastoEdit] = useState(null);

  useEffect(() => {
    fetchExpenses()
      .then(setGastos)
      .catch(() => setError('Error al cargar gastos'));
  }, []);

  const handleAddExpense = async (data) => {
    try {
      const nuevo = await addExpense(data);
      setGastos([nuevo, ...gastos]);
      setOpen(true);
    } catch {
      setError('Error al agregar gasto');
    }
  };

  const handleDeleteExpense = async (gasto) => {
    try {
      await deleteExpense(gasto.id);
      setGastos(gastos.filter(g => g.id !== gasto.id));
    } catch {
      setError('Error al eliminar gasto');
    }
  };

  const handleEditExpense = (gasto) => {
    setGastoEdit(gasto);
    setEditDialog(true);
  };

  const handleUpdateExpense = async (data) => {
    try {
      const actualizado = await updateExpense(gastoEdit.id, data);
      setGastos(gastos.map(g => g.id === gastoEdit.id ? actualizado : g));
      setEditDialog(false);
      setGastoEdit(null);
    } catch {
      setError('Error al actualizar gasto');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Bienvenido/a al panel de finanzas familiares.
      </Typography>
      <ExpenseForm onSubmit={handleAddExpense} />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total gastado este mes</Typography>
            <Typography variant="h5" color="primary">${gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Miembros del grupo</Typography>
            <Typography variant="h5">0</Typography>
          </Paper>
        </Grid>
      </Grid>
      <ExpenseTable gastos={gastos} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />
      <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Gasto agregado correctamente
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Editar gasto</DialogTitle>
        <DialogContent>
          <ExpenseForm onSubmit={handleUpdateExpense} initialData={gastoEdit} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Dashboard; 