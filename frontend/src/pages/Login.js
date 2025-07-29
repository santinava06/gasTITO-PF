import React, { useState } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { login as loginService, setToken } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showError } = useSnackbar();

  // Validación en tiempo real
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'El email es requerido';
        if (!/\S+@\S+\.\S+/.test(value)) return 'El email no es válido';
        return '';

      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Validación en tiempo real
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, form[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const isFormValid = () => {
    return Object.keys(form).every(field => {
      const error = validateField(field, form[field]);
      return !error;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true
    });

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const data = await loginService({ email: form.email, password: form.password });
        setToken(data.token);
        login(data.user, data.token);
        navigate('/');
      } catch {
        showError('Usuario o contraseña incorrectos');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, maxWidth: 400, width: '100%' }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
            Bienvenido
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Inicia sesión en tu cuenta
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            fullWidth
            required
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
              placeholder: 'tu@email.com'
            }}
            sx={{ mb: 3 }}
          />

          <TextField
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            fullWidth
            required
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              placeholder: '••••••••'
            }}
            sx={{ mb: 3 }}
          />

          {/* Mostrar errores generales */}
          {Object.keys(errors).some(key => errors[key]) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Por favor, corrige los errores en el formulario antes de continuar.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={!isFormValid() || loading}
            startIcon={<LoginIcon />}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: '#22336c', textDecoration: 'none', fontWeight: 600 }}>
              Regístrate aquí
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login; 