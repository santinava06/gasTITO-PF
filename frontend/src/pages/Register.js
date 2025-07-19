import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material';
import { register as registerService, saveAuth } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await registerService(form.email, form.password);
      saveAuth(data);
      login(data.user, data.token);
      navigate('/');
    } catch {
      setError('No se pudo registrar. ¿El email ya existe?');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" gutterBottom>Registrarse</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Registrarse
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2 }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Register; 