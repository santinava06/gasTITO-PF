import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress, Tooltip, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Pause, PlayArrow, Delete, Add } from '@mui/icons-material';
import { getAllRecurringExpenses, pauseRecurringExpense, resumeRecurringExpense, deleteRecurringExpense, createRecurringExpense } from '../services/recurringExpenses';

const FREQUENCIES = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'anual', label: 'Anual' },
];

export default function RecurringExpensesDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ monto: '', descripcion: '', categoria: '', frecuencia: 'mensual', proxima_fecha: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [groups, setGroups] = useState([]);

  // Cargar grupos del usuario para el select
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/groups', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const data = await res.json();
          setGroups(data);
        }
      } catch {}
    }
    fetchGroups();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllRecurringExpenses();
      setExpenses(data);
    } catch (err) {
      setError('Error al cargar gastos recurrentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenDialog = () => {
    setForm({ monto: '', descripcion: '', categoria: '', frecuencia: 'mensual', proxima_fecha: '' });
    setFormError('');
    setOpenDialog(true);
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      if (!form.monto || !form.descripcion || !form.categoria || !form.proxima_fecha) {
        setFormError('Completa todos los campos');
        setSubmitting(false);
        return;
      }
      await createRecurringExpense(form);
      setSuccess('Gasto recurrente creado');
      setOpenDialog(false);
      fetchExpenses();
    } catch (err) {
      setFormError('Error al crear gasto recurrente');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (id) => {
    await pauseRecurringExpense(id);
    fetchExpenses();
  };
  const handleResume = async (id) => {
    await resumeRecurringExpense(id);
    fetchExpenses();
  };
  const handleDelete = async (id) => {
    await deleteRecurringExpense(id);
    fetchExpenses();
  };

  return (
    <Box my={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" gutterBottom>Gastos Recurrentes</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          Nuevo Gasto Recurrente
        </Button>
      </Box>
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Monto</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Próxima Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">Sin gastos recurrentes</TableCell></TableRow>
              ) : expenses.map(exp => (
                <TableRow key={exp.id}>
                  <TableCell>${Number(exp.monto).toFixed(2)}</TableCell>
                  <TableCell>{exp.descripcion}</TableCell>
                  <TableCell>{exp.categoria}</TableCell>
                  <TableCell>{FREQUENCIES.find(f => f.value === exp.frecuencia)?.label || exp.frecuencia}</TableCell>
                  <TableCell>{exp.proxima_fecha}</TableCell>
                  <TableCell>{exp.activo ? 'Activo' : 'Pausado'}</TableCell>
                  <TableCell align="right">
                    {exp.activo ? (
                      <Tooltip title="Pausar">
                        <IconButton onClick={() => handlePause(exp.id)}><Pause /></IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Reanudar">
                        <IconButton onClick={() => handleResume(exp.id)}><PlayArrow /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(exp.id)}><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogo para crear gasto recurrente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Gasto Recurrente</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            label="Monto"
            name="monto"
            type="number"
            value={form.monto}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Categoría"
            name="categoria"
            value={form.categoria}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Frecuencia</InputLabel>
            <Select
              label="Frecuencia"
              name="frecuencia"
              value={form.frecuencia}
              onChange={handleFormChange}
            >
              {FREQUENCIES.map(f => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Próxima Fecha"
            name="proxima_fecha"
            type="date"
            value={form.proxima_fecha}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={submitting}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}