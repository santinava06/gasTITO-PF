import React, { useState, useEffect } from 'react';
import { TextField, Button, Grid, MenuItem, Paper, Typography } from '@mui/material';

const categorias = [
  'Alimentos',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Otros',
];

function ExpenseForm({ onSubmit, initialData }) {
  const [form, setForm] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        monto: initialData.monto || '',
        categoria: initialData.categoria || '',
        descripcion: initialData.descripcion || '',
        fecha: initialData.fecha || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    setForm({ monto: '', categoria: '', descripcion: '', fecha: '' });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>{initialData ? 'Editar gasto' : 'Agregar gasto'}</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Monto"
              name="monto"
              type="number"
              value={form.monto}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              label="Categoría"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              fullWidth
              required
            >
              {categorias.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              {initialData ? 'Guardar cambios' : 'Agregar gasto'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

export default ExpenseForm; 