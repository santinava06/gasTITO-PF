import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  Autocomplete,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Categorías base con iconos y colores
const categoriasBase = [
  { name: 'Alimentos', icon: '🍽️', color: '#4caf50' },
  { name: 'Transporte', icon: '🚗', color: '#2196f3' },
  { name: 'Servicios', icon: '⚡', color: '#ff9800' },
  { name: 'Entretenimiento', icon: '🎬', color: '#9c27b0' },
  { name: 'Salud', icon: '🏥', color: '#f44336' },
  { name: 'Educación', icon: '📚', color: '#795548' },
  { name: 'Ropa', icon: '👕', color: '#607d8b' },
  { name: 'Hogar', icon: '🏠', color: '#8bc34a' },
  { name: 'Otros', icon: '📦', color: '#9e9e9e' },
];

function ExpenseForm({ onSubmit, initialData }) {
  const [form, setForm] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: new Date(),
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('customCategories');
    return saved ? JSON.parse(saved) : [];
  });

  // Combinar categorías base con personalizadas
  const allCategories = [...categoriasBase, ...customCategories];

  useEffect(() => {
    if (initialData) {
      setForm({
        monto: initialData.monto || '',
        categoria: initialData.categoria || '',
        descripcion: initialData.descripcion || '',
        fecha: initialData.fecha ? parseISO(initialData.fecha) : new Date(),
      });
    }
  }, [initialData]);

  // Guardar categorías personalizadas en localStorage
  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  // Validación en tiempo real
  const validateField = (name, value) => {
    switch (name) {
      case 'monto':
        if (!value) return 'El monto es requerido';
        if (isNaN(value) || parseFloat(value) <= 0) return 'El monto debe ser un número positivo';
        if (parseFloat(value) > 1000000) return 'El monto no puede ser mayor a $1,000,000';
        return '';
      
      case 'categoria':
        if (!value) return 'La categoría es requerida';
        return '';
      
      case 'fecha':
        if (!value) return 'La fecha es requerida';
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) return 'La fecha no puede ser futura';
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

  const handleDateChange = (date) => {
    setForm(prev => ({ ...prev, fecha: date }));
    if (touched.fecha) {
      const error = validateField('fecha', date);
      setErrors(prev => ({ ...prev, fecha: error }));
    }
  };

  const handleCategoryChange = (event, newValue) => {
    setForm(prev => ({ ...prev, categoria: newValue }));
    if (touched.categoria) {
      const error = validateField('categoria', newValue);
      setErrors(prev => ({ ...prev, categoria: error }));
    }
  };

  const handleAddCustomCategory = (categoryName) => {
    if (categoryName && !allCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      const newCategory = {
        name: categoryName,
        icon: '📝',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };
      setCustomCategories(prev => [...prev, newCategory]);
      setForm(prev => ({ ...prev, categoria: categoryName }));
    }
  };

  const isFormValid = () => {
    const requiredFields = ['monto', 'categoria', 'fecha'];
    return requiredFields.every(field => {
      const error = validateField(field, form[field]);
      return !error;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched({
      monto: true,
      categoria: true,
      descripcion: true,
      fecha: true
    });

    if (Object.keys(newErrors).length === 0) {
      const formData = {
        ...form,
        fecha: format(form.fecha, 'yyyy-MM-dd')
      };
      
      if (onSubmit) onSubmit(formData);
      setForm({ monto: '', categoria: '', descripcion: '', fecha: new Date() });
      setErrors({});
      setTouched({});
    }
  };

  const getCategoryIcon = (categoryName) => {
    const category = allCategories.find(cat => cat.name === categoryName);
    return category ? category.icon : '📦';
  };

  const getCategoryColor = (categoryName) => {
    const category = allCategories.find(cat => cat.name === categoryName);
    return category ? category.color : '#9e9e9e';
  };

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            {initialData ? 'Editar gasto' : 'Agregar nuevo gasto'}
          </Typography>
          <Box>
            <Tooltip title="Vista previa del gasto">
              <span>
                <IconButton 
                  onClick={() => setShowPreview(true)}
                  disabled={!form.monto || !form.categoria}
                  color="primary"
                >
                  <PreviewIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Campo Monto */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Monto"
                name="monto"
                type="number"
                value={form.monto}
                onChange={handleChange}
                onBlur={() => handleBlur('monto')}
                fullWidth
                required
                error={!!errors.monto}
                helperText={errors.monto}
                InputProps={{
                  startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  inputProps: { 
                    min: 0,
                    step: 0.01,
                    placeholder: '0.00'
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: errors.monto ? '#fff3f3' : 'inherit'
                  }
                }}
              />
            </Grid>

            {/* Campo Categoría con Autocompletado */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                value={form.categoria}
                onChange={handleCategoryChange}
                onBlur={() => handleBlur('categoria')}
                options={allCategories.map(cat => cat.name)}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoría"
                    required
                    error={!!errors.categoria}
                    helperText={errors.categoria}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box display="flex" alignItems="center">
                      <span style={{ marginRight: 8 }}>
                        {getCategoryIcon(option)}
                      </span>
                      {option}
                    </Box>
                  </Box>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      icon={<span>{getCategoryIcon(option)}</span>}
                      sx={{ backgroundColor: getCategoryColor(option) + '20' }}
                    />
                  ))
                }
                onInputChange={(event, newInputValue) => {
                  if (event && event.type === 'keydown' && event.key === 'Enter') {
                    handleAddCustomCategory(newInputValue);
                  }
                }}
              />
            </Grid>

            {/* Campo Descripción */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={() => handleBlur('descripcion')}
                fullWidth
                multiline
                rows={1}
                InputProps={{
                  startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                placeholder="Descripción opcional del gasto"
              />
            </Grid>

            {/* Selector de Fecha Mejorado */}
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha"
                  value={form.fecha}
                  onChange={handleDateChange}
                  onBlur={() => handleBlur('fecha')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.fecha}
                      helperText={errors.fecha}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  )}
                  maxDate={new Date()}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
            </Grid>

            {/* Botón de Envío */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!isFormValid()}
                  startIcon={initialData ? <EditIcon /> : <AddIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {initialData ? 'Guardar cambios' : 'Agregar gasto'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Mostrar errores generales */}
        {Object.keys(errors).some(key => errors[key]) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Por favor, corrige los errores en el formulario antes de continuar.
          </Alert>
        )}
      </Paper>

      {/* Diálogo de Preview */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Vista Previa del Gasto
        </DialogTitle>
        <DialogContent>
          <Card elevation={2} sx={{ p: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  ${parseFloat(form.monto || 0).toLocaleString()}
                </Typography>
                <Chip
                  label={form.categoria}
                  icon={<span>{getCategoryIcon(form.categoria)}</span>}
                  sx={{ 
                    backgroundColor: getCategoryColor(form.categoria) + '20',
                    color: getCategoryColor(form.categoria)
                  }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Fecha: {form.fecha ? format(form.fecha, 'EEEE, dd/MM/yyyy', { locale: es }) : 'No seleccionada'}
                  </Typography>
                </Box>
                
                {form.descripcion && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <DescriptionIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Descripción: {form.descripcion}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cerrar</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleSubmit({ preventDefault: () => {} });
              setShowPreview(false);
            }}
            disabled={!isFormValid()}
          >
            Confirmar y Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ExpenseForm; 