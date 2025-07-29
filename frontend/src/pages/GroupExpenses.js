import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Tooltip,
  Card as MuiCard,
  Alert,
  InputAdornment,
  Autocomplete,
  Fade,
  Zoom,
  Slide,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  getGroupDetails,
  getGroupExpenses,
  addGroupExpense,
  deleteGroupExpense,
  inviteToGroup,
  updateMemberRole,
  updateGroupExpense
} from '../services/groups';
import { useSnackbar } from '../context/SnackbarContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Cell, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SectionLoading, ContentSkeleton, ActionLoading } from '../components/LoadingSpinner';
import MemberDebts from '../components/MemberDebts';
import LazyMembersList from '../components/LazyMembersList';

// Categorías base para el formulario
const categoriasBase = [
  'Alimentos',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Hogar',
  'Otros'
];

function GroupExpenses() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Estados para paginación y filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados para lazy loading y cache
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [cachedExpenses, setCachedExpenses] = useState(new Map());
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  // Cache TTL (5 minutos)
  const CACHE_TTL = 5 * 60 * 1000;
  
  // Estado para tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para formularios
  const [newExpense, setNewExpense] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: new Date()
  });
  
  const [customCategories, setCustomCategories] = useState([]);
  const allCategories = [...categoriasBase, ...customCategories];
  
  // Estados para validación
  const [expenseErrors, setExpenseErrors] = useState({});
  const [expenseTouched, setExpenseTouched] = useState({});
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviteTouched, setInviteTouched] = useState({});
  
  // Estados para loading
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Estados para invitación
  const [inviteData, setInviteData] = useState({
    email: ''
  });

  // Función para verificar si el cache es válido
  const isCacheValid = useCallback((groupId) => {
    const cached = cachedExpenses.get(groupId);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_TTL;
  }, [cachedExpenses]);

  const loadGroupData = useCallback(async (options = {}) => {
    try {
      const [groupData, expensesResponse] = await Promise.all([
        getGroupDetails(groupId),
        getGroupExpenses(groupId, options)
      ]);
      
      setGroup(groupData);
      
      // Manejar la nueva respuesta con paginación
      if (expensesResponse.expenses) {
        setExpenses(expensesResponse.expenses);
        // Guardar información de paginación si es necesario
        if (expensesResponse.pagination) {
          setHasMoreData(expensesResponse.pagination.hasNext);
        }
      } else {
        // Fallback para respuesta antigua
        setExpenses(expensesResponse);
      }
      
      setMembers(groupData.members || []);
      setLastFetchTime(Date.now());
      
      // Cache de los datos
      setCachedExpenses(prev => {
        const newCache = new Map(prev);
        newCache.set(groupId, {
          expenses: expensesResponse.expenses || expensesResponse,
          timestamp: Date.now()
        });
        return newCache;
      });
    } catch (error) {
      showError('Error al cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  }, [groupId, showError]);

  useEffect(() => {
    const loadData = async () => {
      if (isCacheValid(groupId)) {
        const cached = cachedExpenses.get(groupId);
        setExpenses(cached.expenses);
        setLoading(false);
        return;
      }
      
      await loadGroupData();
    };
    
    loadData();
    
    // Cargar categorías personalizadas del localStorage
    const savedCategories = localStorage.getItem('customCategories');
    if (savedCategories) {
      setCustomCategories(JSON.parse(savedCategories));
    }
  }, [groupId, isCacheValid, cachedExpenses, loadGroupData]);

  // Función para filtrar y ordenar gastos
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filtro por categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.categoria === filterCategory);
    }

    // Filtro por fecha
    if (filterDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filterDate) {
        case 'today':
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.fecha);
            return expenseDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.fecha);
            return expenseDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.fecha);
            return expenseDate >= monthAgo;
          });
          break;
      }
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.paid_by_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'fecha':
          aValue = new Date(a.fecha);
          bValue = new Date(b.fecha);
          break;
        case 'monto':
          aValue = Number(a.monto);
          bValue = Number(b.monto);
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        default:
          aValue = new Date(a.fecha);
          bValue = new Date(b.fecha);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, filterCategory, filterDate, searchTerm, sortBy, sortOrder]);

  // Gastos paginados
  const paginatedExpenses = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedExpenses.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedExpenses, page, rowsPerPage]);

  // Obtener categorías únicas para el filtro
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(expenses.map(expense => expense.categoria))];
    return categories.sort();
  }, [expenses]);

  // Handlers para paginación y filtros
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (filterType, value) => {
    setPage(0); // Resetear a la primera página
    switch (filterType) {
      case 'category':
        setFilterCategory(value);
        break;
      case 'date':
        setFilterDate(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      case 'order':
        setSortOrder(value);
        break;
    }
  };

  // Funciones de validación
  const validateExpenseField = (name, value) => {
    switch (name) {
      case 'monto':
        if (!value) return 'El monto es requerido';
        if (isNaN(value) || Number(value) <= 0) return 'El monto debe ser un número positivo';
        return '';
      case 'categoria':
        if (!value) return 'La categoría es requerida';
        return '';
      case 'descripcion':
        if (!value.trim()) return 'La descripción es requerida';
        if (value.length < 3) return 'La descripción debe tener al menos 3 caracteres';
        return '';
      default:
        return '';
    }
  };

  const validateInviteField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'El email es requerido';
        if (!/\S+@\S+\.\S+/.test(value)) return 'El email no es válido';
        return '';
      default:
        return '';
    }
  };

  // Handlers para formularios
  const handleExpenseChange = (name, value) => {
    setNewExpense(prev => ({ ...prev, [name]: value }));
    setExpenseTouched(prev => ({ ...prev, [name]: true }));
    setExpenseErrors(prev => ({ ...prev, [name]: validateExpenseField(name, value) }));
  };

  const handleExpenseBlur = (name) => {
    setExpenseTouched(prev => ({ ...prev, [name]: true }));
    setExpenseErrors(prev => ({ ...prev, [name]: validateExpenseField(name, newExpense[name]) }));
  };

  const handleDateChange = (date) => {
    setNewExpense(prev => ({ ...prev, fecha: date }));
  };

  const handleCategoryChange = (event, newValue) => {
    setNewExpense(prev => ({ ...prev, categoria: newValue }));
    setExpenseTouched(prev => ({ ...prev, categoria: true }));
    setExpenseErrors(prev => ({ ...prev, categoria: validateExpenseField('categoria', newValue) }));
  };

  const handleAddCustomCategory = (newCategory) => {
    if (newCategory && !allCategories.includes(newCategory)) {
      const updatedCategories = [...customCategories, newCategory];
      setCustomCategories(updatedCategories);
      localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
      setNewExpense(prev => ({ ...prev, categoria: newCategory }));
    }
  };

  const handleInviteChange = (name, value) => {
    setInviteData(prev => ({ ...prev, [name]: value }));
    setInviteTouched(prev => ({ ...prev, [name]: true }));
    setInviteErrors(prev => ({ ...prev, [name]: validateInviteField(name, value) }));
  };

  const handleInviteBlur = (name) => {
    setInviteTouched(prev => ({ ...prev, [name]: true }));
    setInviteErrors(prev => ({ ...prev, [name]: validateInviteField(name, inviteData[name]) }));
  };

  // Validación de formularios
  const isExpenseFormValid = () => {
    return Object.keys(newExpense).every(key => 
      newExpense[key] && !expenseErrors[key]
    );
  };

  const isInviteFormValid = () => {
    return Object.keys(inviteData).every(key => 
      inviteData[key] && !inviteErrors[key]
    );
  };

  // Handlers para acciones
  const handleAddExpense = async () => {
    if (!isExpenseFormValid()) {
      // Validar todos los campos
      Object.keys(newExpense).forEach(key => {
        setExpenseTouched(prev => ({ ...prev, [key]: true }));
        setExpenseErrors(prev => ({ ...prev, [key]: validateExpenseField(key, newExpense[key]) }));
      });
      return;
    }

    setAddLoading(true);
    try {
      const expenseData = {
        ...newExpense,
        monto: Number(newExpense.monto),
        fecha: format(newExpense.fecha, 'yyyy-MM-dd')
      };
      
      await addGroupExpense(groupId, expenseData);
      showSuccess('Gasto agregado exitosamente');
      setAddDialog(false);
      resetExpenseForm();
      loadGroupData();
    } catch (error) {
      showError('Error al agregar el gasto');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      monto: expense.monto.toString(),
      categoria: expense.categoria,
      descripcion: expense.descripcion,
      fecha: parseISO(expense.fecha)
    });
    setEditDialog(true);
  };

  const handleUpdateExpense = async () => {
    if (!isExpenseFormValid()) {
      Object.keys(newExpense).forEach(key => {
        setExpenseTouched(prev => ({ ...prev, [key]: true }));
        setExpenseErrors(prev => ({ ...prev, [key]: validateExpenseField(key, newExpense[key]) }));
      });
      return;
    }

    setEditLoading(true);
    try {
      const expenseData = {
        ...newExpense,
        monto: Number(newExpense.monto),
        fecha: format(newExpense.fecha, 'yyyy-MM-dd')
      };
      
      await updateGroupExpense(groupId, editingExpense.id, expenseData);
      showSuccess('Gasto actualizado exitosamente');
      setEditDialog(false);
      resetExpenseForm();
      loadGroupData();
    } catch (error) {
      showError('Error al actualizar el gasto');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await deleteGroupExpense(groupId, expense.id);
        showSuccess('Gasto eliminado exitosamente');
        loadGroupData();
      } catch (error) {
        showError('Error al eliminar el gasto');
      }
    }
  };

  const handleInvite = async () => {
    if (!isInviteFormValid()) {
      Object.keys(inviteData).forEach(key => {
        setInviteTouched(prev => ({ ...prev, [key]: true }));
        setInviteErrors(prev => ({ ...prev, [key]: validateInviteField(key, inviteData[key]) }));
      });
      return;
    }

    setInviteLoading(true);
    try {
      await inviteToGroup(groupId, inviteData.email);
      showSuccess('Invitación enviada exitosamente');
      setInviteDialog(false);
      setInviteData({ email: '' });
      setInviteErrors({});
      setInviteTouched({});
    } catch (error) {
      showError('Error al enviar la invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const resetExpenseForm = () => {
    setNewExpense({
      monto: '',
      categoria: '',
      descripcion: '',
      fecha: new Date()
    });
    setExpenseErrors({});
    setExpenseTouched({});
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Funciones helper
  const getCategoryIcon = (category) => {
    const icons = {
      'Alimentos': '🍽️',
      'Transporte': '🚗',
      'Servicios': '⚡',
      'Entretenimiento': '🎮',
      'Salud': '🏥',
      'Educación': '📚',
      'Ropa': '👕',
      'Hogar': '🏠',
      'Otros': '📦'
    };
    return icons[category] || '📦';
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

  const getInitials = (email) => {
    if (!email) return '??';
    return email.substring(0, 2).toUpperCase();
  };

  const canEditExpense = (expense) => {
    return user && (user.id === expense.paid_by || 
                   (group && group.members && group.members.find(m => m.id === user.id) && group.members.find(m => m.id === user.id).role === 'admin') ||
                   (group && group.members && group.members.find(m => m.id === user.id) && group.members.find(m => m.id === user.id).role === 'owner'));
  };

  const canDeleteExpense = (expense) => {
    return user && (user.id === expense.paid_by || 
                   (group && group.members && group.members.find(m => m.id === user.id) && group.members.find(m => m.id === user.id).role === 'admin') ||
                   (group && group.members && group.members.find(m => m.id === user.id) && group.members.find(m => m.id === user.id).role === 'owner'));
  };

  if (loading) {
    return <SectionLoading section="groups" />;
  }

  if (!group) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Grupo no encontrado
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Tooltip title="Volver a grupos" arrow>
                <IconButton onClick={() => navigate('/groups')} sx={{ mr: 2 }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="h4" gutterBottom>
                {group.nombre}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {group.descripcion}
              </Typography>
            </Box>
            
            <Box display="flex" gap={2}>
              <Tooltip title="Agregar gasto" arrow>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialog(true)}
                >
                  Agregar Gasto
                </Button>
              </Tooltip>
              
              <Tooltip title="Invitar miembro" arrow>
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={() => setInviteDialog(true)}
                >
                  Invitar Miembro
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Tabs de navegación */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab icon={<MoneyIcon />} label="Gastos" />
              <Tab icon={<AccountBalanceIcon />} label="Análisis de Deudas" />
              <Tab icon={<PeopleIcon />} label="Miembros" />
            </Tabs>
          </Paper>

          {/* Contenido de las tabs */}
          <Box>
            {/* Tab de Gastos */}
            {activeTab === 0 && (
              <Fade in={true} timeout={500}>
                <Box>
                  {/* Resumen del grupo */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Zoom in={true} timeout={300}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <MoneyIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">Total Gastos</Typography>
                                <Typography variant="h4" color="primary">
                                  ${expenses.reduce((sum, exp) => sum + Number(exp.monto), 0).toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {expenses.length} gastos registrados
                            </Typography>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Zoom in={true} timeout={400}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <PeopleIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">Miembros</Typography>
                                <Typography variant="h4" color="secondary">
                                  {members.length}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Participando en el grupo
                            </Typography>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Zoom in={true} timeout={500}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar sx={{ bgcolor: 'success.main' }}>
                                <TrendingUpIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">Promedio por Persona</Typography>
                                <Typography variant="h4" color="success.main">
                                  ${members.length > 0 ? (expenses.reduce((sum, exp) => sum + Number(exp.monto), 0) / members.length).toFixed(2) : '0.00'}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Distribución equitativa
                            </Typography>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  </Grid>

                  {/* Controles de filtro y búsqueda */}
                  <Slide in={true} timeout={600} direction="up">
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Filtros y Búsqueda
                      </Typography>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Buscar gastos"
                            value={searchTerm}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Categoría</InputLabel>
                            <Select
                              value={filterCategory}
                              onChange={(e) => handleFilterChange('category', e.target.value)}
                              label="Categoría"
                            >
                              <MenuItem value="all">Todas</MenuItem>
                              {uniqueCategories.map((category) => (
                                <MenuItem key={category} value={category}>
                                  {category}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Período</InputLabel>
                            <Select
                              value={filterDate}
                              onChange={(e) => handleFilterChange('date', e.target.value)}
                              label="Período"
                            >
                              <MenuItem value="all">Todos</MenuItem>
                              <MenuItem value="today">Hoy</MenuItem>
                              <MenuItem value="week">Esta semana</MenuItem>
                              <MenuItem value="month">Este mes</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Ordenar por</InputLabel>
                            <Select
                              value={sortBy}
                              onChange={(e) => handleFilterChange('sort', e.target.value)}
                              label="Ordenar por"
                            >
                              <MenuItem value="fecha">Fecha</MenuItem>
                              <MenuItem value="monto">Monto</MenuItem>
                              <MenuItem value="categoria">Categoría</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Orden</InputLabel>
                            <Select
                              value={sortOrder}
                              onChange={(e) => handleFilterChange('order', e.target.value)}
                              label="Orden"
                            >
                              <MenuItem value="desc">Descendente</MenuItem>
                              <MenuItem value="asc">Ascendente</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={1}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setFilterCategory('all');
                              setFilterDate('all');
                              setSearchTerm('');
                              setSortBy('fecha');
                              setSortOrder('desc');
                              setPage(0);
                            }}
                            size="small"
                            fullWidth
                          >
                            Limpiar
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Slide>

                  {/* Tabla de gastos */}
                  <Slide in={true} timeout={700} direction="up">
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Lista de Gastos
                      </Typography>
                      
                      {filteredAndSortedExpenses.length === 0 ? (
                        <Box textAlign="center" py={4}>
                          <Typography color="text.secondary">
                            {expenses.length === 0 ? 'No hay gastos registrados en este grupo.' : 'No se encontraron gastos con los filtros aplicados.'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {expenses.length === 0 ? 'Agrega el primer gasto para comenzar a rastrear los gastos compartidos.' : 'Intenta ajustar los filtros de búsqueda.'}
                          </Typography>
                        </Box>
                      ) : (
                        <React.Fragment>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Fecha</TableCell>
                                  <TableCell>Categoría</TableCell>
                                  <TableCell>Descripción</TableCell>
                                  <TableCell align="right">Monto</TableCell>
                                  <TableCell>Miembro</TableCell>
                                  <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {paginatedExpenses.map((expense, index) => (
                                  <Fade in={true} timeout={300 + index * 50} key={expense.id}>
                                    <TableRow hover>
                                      <TableCell>
                                        {new Date(expense.fecha).toLocaleDateString('es-ES')}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={expense.categoria}
                                          size="small"
                                          sx={{
                                            backgroundColor: getCategoryColor(expense.categoria) + '20',
                                            color: getCategoryColor(expense.categoria)
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>{expense.descripcion}</TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight={600} color="primary">
                                          ${Number(expense.monto).toFixed(2)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {getInitials(expense.paid_by_email)}
                                          </Avatar>
                                          <Typography variant="body2">
                                            {expense.paid_by_email}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Box display="flex" gap={1} justifyContent="center">
                                          {canEditExpense(expense) && (
                                            <Tooltip title="Editar gasto" arrow>
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEditExpense(expense)}
                                              >
                                                <EditIcon />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          {canDeleteExpense(expense) && (
                                            <Tooltip title="Eliminar gasto" arrow>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteExpense(expense)}
                                              >
                                                <DeleteIcon />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  </Fade>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          {/* Paginación */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Mostrando {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAndSortedExpenses.length)} de {filteredAndSortedExpenses.length} gastos
                            </Typography>
                          </Box>
                        </React.Fragment>
                      )}
                    </Paper>
                  </Slide>
                </Box>
              </Fade>
            )}

            {/* Tab de Análisis de Deudas */}
            {activeTab === 1 && (
              <Fade in={true} timeout={500}>
                <Box>
                  <MemberDebts 
                    expenses={expenses}
                    members={members}
                    groupName={group.nombre}
                  />
                </Box>
              </Fade>
            )}

            {/* Tab de Miembros */}
            {activeTab === 2 && (
              <Fade in={true} timeout={500}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Miembros del Grupo
                  </Typography>
                  
                  <LazyMembersList
                    members={members}
                    getInitials={getInitials}
                    loading={loading}
                    hasMore={false} // Por ahora no hay paginación de miembros en el backend
                    onLoadMore={() => {}} // Placeholder para futura implementación
                  />
                </Box>
              </Fade>
            )}
          </Box>

          {/* Dialog para agregar gasto */}
          <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <AddIcon />
                Agregar Gasto al Grupo
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Monto"
                    type="number"
                    value={newExpense.monto}
                    onChange={(e) => handleExpenseChange('monto', e.target.value)}
                    onBlur={() => handleExpenseBlur('monto')}
                    error={expenseTouched.monto && !!expenseErrors.monto}
                    helperText={expenseTouched.monto && expenseErrors.monto}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    options={allCategories}
                    value={newExpense.categoria}
                    onChange={handleCategoryChange}
                    onInputChange={(event, newInputValue) => {
                      if (newInputValue && !allCategories.includes(newInputValue)) {
                        handleAddCustomCategory(newInputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categoría"
                        error={expenseTouched.categoria && !!expenseErrors.categoria}
                        helperText={expenseTouched.categoria && expenseErrors.categoria}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CategoryIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={newExpense.descripcion}
                    onChange={(e) => handleExpenseChange('descripcion', e.target.value)}
                    onBlur={() => handleExpenseBlur('descripcion')}
                    error={expenseTouched.descripcion && !!expenseErrors.descripcion}
                    helperText={expenseTouched.descripcion && expenseErrors.descripcion}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                    <DatePicker
                      label="Fecha"
                      value={newExpense.fecha}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              
              {Object.keys(expenseErrors).some(key => expenseErrors[key]) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Por favor, corrige los errores en el formulario antes de continuar.
                  </Typography>
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleAddExpense}
                variant="contained"
                disabled={!isExpenseFormValid() || addLoading}
                startIcon={addLoading ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {addLoading ? 'Agregando...' : 'Agregar Gasto'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog para editar gasto */}
          <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <EditIcon />
                Editar Gasto
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Monto"
                    type="number"
                    value={newExpense.monto}
                    onChange={(e) => handleExpenseChange('monto', e.target.value)}
                    onBlur={() => handleExpenseBlur('monto')}
                    error={expenseTouched.monto && !!expenseErrors.monto}
                    helperText={expenseTouched.monto && expenseErrors.monto}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    options={allCategories}
                    value={newExpense.categoria}
                    onChange={handleCategoryChange}
                    onInputChange={(event, newInputValue) => {
                      if (newInputValue && !allCategories.includes(newInputValue)) {
                        handleAddCustomCategory(newInputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categoría"
                        error={expenseTouched.categoria && !!expenseErrors.categoria}
                        helperText={expenseTouched.categoria && expenseErrors.categoria}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CategoryIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={newExpense.descripcion}
                    onChange={(e) => handleExpenseChange('descripcion', e.target.value)}
                    onBlur={() => handleExpenseBlur('descripcion')}
                    error={expenseTouched.descripcion && !!expenseErrors.descripcion}
                    helperText={expenseTouched.descripcion && expenseErrors.descripcion}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                    <DatePicker
                      label="Fecha"
                      value={newExpense.fecha}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              
              {Object.keys(expenseErrors).some(key => expenseErrors[key]) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Por favor, corrige los errores en el formulario antes de continuar.
                  </Typography>
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleUpdateExpense}
                variant="contained"
                disabled={!isExpenseFormValid() || editLoading}
                startIcon={editLoading ? <CircularProgress size={20} /> : <EditIcon />}
              >
                {editLoading ? 'Actualizando...' : 'Actualizar Gasto'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog para invitar miembro */}
          <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SendIcon />
                Invitar Miembro al Grupo
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email del miembro"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => handleInviteChange('email', e.target.value)}
                    onBlur={() => handleInviteBlur('email')}
                    error={inviteTouched.email && !!inviteErrors.email}
                    helperText={inviteTouched.email && inviteErrors.email}
                    placeholder="ejemplo@email.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              {Object.keys(inviteErrors).some(key => inviteErrors[key]) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Por favor, corrige los errores en el formulario antes de continuar.
                  </Typography>
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInviteDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleInvite}
                variant="contained"
                disabled={!isInviteFormValid() || inviteLoading}
                startIcon={inviteLoading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}

export default GroupExpenses; 