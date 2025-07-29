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
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { register as registerService, saveAuth } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';

function Register() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (!/(?=.*[a-z])/.test(value)) return 'Debe contener al menos una letra minúscula';
        if (!/(?=.*[A-Z])/.test(value)) return 'Debe contener al menos una letra mayúscula';
        if (!/(?=.*\d)/.test(value)) return 'Debe contener al menos un número';
        return '';
      
      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña';
        if (value !== form.password) return 'Las contraseñas no coinciden';
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

    // Validar confirmPassword cuando cambia password
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', form.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
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

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'grey', text: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (password.length >= 8) score++;
    
    const strengths = [
      { strength: 0, color: 'grey', text: 'Muy débil' },
      { strength: 1, color: 'red', text: 'Débil' },
      { strength: 2, color: 'orange', text: 'Regular' },
      { strength: 3, color: 'yellow', text: 'Buena' },
      { strength: 4, color: 'lightgreen', text: 'Fuerte' },
      { strength: 5, color: 'green', text: 'Muy fuerte' }
    ];
    
    return strengths[Math.min(score, 5)];
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
      password: true,
      confirmPassword: true
    });

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const data = await registerService(form.email, form.password);
        saveAuth(data);
        login(data.user, data.token);
        navigate('/');
      } catch {
        showError('No se pudo registrar. ¿El email ya existe?');
      } finally {
        setLoading(false);
      }
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, maxWidth: 400, width: '100%' }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
            Crear Cuenta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Únete a nuestra comunidad
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
            helperText={
              errors.password || 
              (form.password && `Fortaleza: ${passwordStrength.text}`)
            }
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
            sx={{ 
              mb: 1,
              '& .MuiFormHelperText-root': {
                color: passwordStrength.color
              }
            }}
          />

          {/* Barra de fortaleza de contraseña */}
          {form.password && (
            <Box sx={{ mb: 2 }}>
              <Box display="flex" gap={0.5} mb={0.5}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Box
                    key={level}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 1,
                      backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#e0e0e0'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="Confirmar Contraseña"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
            fullWidth
            required
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
            startIcon={loading ? <CheckCircleIcon /> : <PersonAddIcon />}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#22336c', textDecoration: 'none', fontWeight: 600 }}>
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Register; 