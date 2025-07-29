import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Settings as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseTable from '../components/ExpenseTable';
import { fetchExpenses, addExpense, deleteExpense, updateExpense } from '../services/expenses';
import { useSnackbar } from '../context/SnackbarContext';
import { SectionLoading, ContentSkeleton, ActionLoading } from '../components/LoadingSpinner';
import RecurringExpensesDashboard from '../components/RecurringExpensesDashboard';
import { getAllRecurringExpenses } from '../services/recurringExpenses';

// Colores para gráficos
const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];

// Función para obtener el nombre del mes
const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month];
};

// Función para obtener el nombre del día
const getDayName = (day) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[day];
};

// Función para calcular datos de tendencias mensuales
const calculateMonthlyTrends = (expenses) => {
  const monthlyData = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = getMonthName(date.getMonth());
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        total: 0,
        count: 0,
        year: date.getFullYear(),
        monthIndex: date.getMonth()
      };
    }
    
    monthlyData[monthKey].total += Number(expense.monto);
    monthlyData[monthKey].count += 1;
  });

  // Convertir a array y ordenar por fecha
  return Object.values(monthlyData)
    .sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex)
    .slice(-6); // Últimos 6 meses
};

// Función para calcular gastos por día de la semana
const calculateDailyExpenses = (expenses) => {
  const dailyData = Array(7).fill(0).map((_, index) => ({
    day: getDayName(index),
    total: 0,
    count: 0
  }));

  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const dayIndex = date.getDay();
    dailyData[dayIndex].total += Number(expense.monto);
    dailyData[dayIndex].count += 1;
  });

  return dailyData;
};

// Función para calcular distribución por categorías
const calculateCategoryDistribution = (expenses) => {
  const categoryData = {};
  
  expenses.forEach(expense => {
    if (!categoryData[expense.categoria]) {
      categoryData[expense.categoria] = { name: expense.categoria, total: 0, count: 0 };
    }
    categoryData[expense.categoria].total += Number(expense.monto);
    categoryData[expense.categoria].count += 1;
  });

  return Object.values(categoryData)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6); // Top 6 categorías
};

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [expenseEdit, setExpenseEdit] = useState(null);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('userBudget');
    return saved ? parseFloat(saved) : 0;
  });
  const { showSuccess, showError } = useSnackbar();

  useEffect(() => {
    loadExpenses();
    loadRecurringExpenses();
  }, []);

  useEffect(() => {
    localStorage.setItem('userBudget', budget.toString());
  }, [budget]);

  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (error) {
      showError('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  const loadRecurringExpenses = async () => {
    try {
      const data = await getAllRecurringExpenses();
      setRecurringExpenses(data);
    } catch (error) {
      showError('Error al cargar gastos recurrentes');
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const newExpense = await addExpense(expenseData);
      setExpenses([newExpense, ...expenses]);
      setAddDialog(false);
      showSuccess('Gasto agregado exitosamente');
    } catch (error) {
      showError('Error al agregar gasto');
    }
  };

  const handleEditExpense = (expense) => {
    setExpenseEdit(expense);
    setEditDialog(true);
  };

  const handleUpdateExpense = async (expenseData) => {
    try {
      const updatedExpense = await updateExpense(expenseEdit.id, expenseData);
      setExpenses(expenses.map(e => e.id === expenseEdit.id ? updatedExpense : e));
      setEditDialog(false);
      setExpenseEdit(null);
      showSuccess('Gasto actualizado correctamente');
    } catch (error) {
      showError('Error al actualizar gasto');
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    try {
      await deleteExpense(expense.id);
      setExpenses(expenses.filter(e => e.id !== expense.id));
      showSuccess('Gasto eliminado exitosamente');
    } catch (error) {
      showError('Error al eliminar gasto');
    }
  };

  // Calcular estadísticas
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const monthlyTrends = calculateMonthlyTrends(expenses);
  const dailyExpenses = calculateDailyExpenses(expenses);
  const categoryDistribution = calculateCategoryDistribution(expenses);

  // Calcular alertas de presupuesto
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses
    .filter(expense => {
      const date = new Date(expense.fecha);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + Number(expense.monto), 0);

  // Sumar gastos recurrentes activos del mes actual
  const currentMonthRecurring = recurringExpenses
    .filter(e => e.activo && (() => {
      const date = new Date(e.proxima_fecha);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })())
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const currentMonthTotal = currentMonthExpenses + currentMonthRecurring;

  const budgetUsage = budget > 0 ? (currentMonthTotal / budget) * 100 : 0;
  const budgetRemaining = budget - currentMonthTotal;

  // Mostrar loading mientras carga
  if (loading) {
    return <SectionLoading section="dashboard" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Resumen de tus gastos y finanzas personales
          </Typography>

          {/* Widgets de resumen rápido */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} timeout={300}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <MoneyIcon color="primary" />
                      <Typography variant="h6">Total Gastos</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${totalExpenses.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {expenses.length} gastos registrados
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} timeout={400}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AssessmentIcon color="primary" />
                      <Typography variant="h6">Promedio</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${averageExpense.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Por gasto
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} timeout={500}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CalendarIcon color="primary" />
                      <Typography variant="h6">Este Mes</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${currentMonthTotal.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gastos del mes actual
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} timeout={600}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccountBalanceIcon color="primary" />
                      <Typography variant="h6">Presupuesto</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${budget.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Presupuesto mensual
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>

          {/* Alertas de presupuesto */}
          {budget > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {budgetUsage >= 90 ? (
                  <WarningIcon color="error" />
                ) : budgetUsage >= 75 ? (
                  <WarningIcon color="warning" />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
                <Typography variant="h6">
                  Estado del Presupuesto
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    Uso del presupuesto: {budgetUsage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    ${currentMonthTotal.toFixed(2)} / ${budget.toFixed(2)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(budgetUsage, 100)}
                  color={budgetUsage >= 90 ? 'error' : budgetUsage >= 75 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {budgetUsage >= 90 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  ¡Cuidado! Has gastado el {budgetUsage.toFixed(1)}% de tu presupuesto mensual.
                </Alert>
              )}
              
              {budgetUsage >= 75 && budgetUsage < 90 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Has gastado el {budgetUsage.toFixed(1)}% de tu presupuesto. Considera reducir gastos.
                </Alert>
              )}

              {budgetRemaining > 0 && (
                <Alert severity="info">
                  Te quedan ${budgetRemaining.toFixed(2)} disponibles este mes.
                </Alert>
              )}

              <Box sx={{ mt: 2 }}>
                <Tooltip title="Configurar presupuesto" arrow>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setBudgetDialog(true)}
                  >
                    Configurar Presupuesto
                  </Button>
                </Tooltip>
              </Box>
            </Paper>
          )}

          {/* Gráficos */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Tendencia mensual */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={true} timeout={700}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Tendencia Mensual
                  </Typography>
                  {monthlyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `$${value}`} />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#22336c" 
                          strokeWidth={3}
                          dot={{ fill: '#22336c', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography color="text.secondary">
                        No hay datos suficientes para mostrar la tendencia
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Slide>
            </Grid>

            {/* Gastos por día de la semana */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={true} timeout={800}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Gastos por Día de la Semana
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `$${value}`} />
                      <Bar dataKey="total" fill="#43a047" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Slide>
            </Grid>
          </Grid>

          {/* Distribución por categorías */}
          {categoryDistribution.length > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Distribución por Categorías
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    {categoryDistribution.map((category, index) => (
                      <Box key={category.name} display="flex" alignItems="center" gap={2} mb={2}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: COLORS[index % COLORS.length]
                          }}
                        />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {category.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {category.count} gastos
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                          ${category.total.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Botón agregar gasto */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Tooltip title="Agregar nuevo gasto" arrow>
              <Button
                variant="contained"
                size="large"
                startIcon={<MoneyIcon />}
                onClick={() => setAddDialog(true)}
              >
                Agregar Gasto
              </Button>
            </Tooltip>
          </Box>

          {/* Tabla de gastos */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gastos Recientes
            </Typography>
            <RecurringExpensesDashboard />
            <ExpenseTable 
              gastos={expenses.slice(0, 10)} 
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          </Paper>

          {/* Dialog agregar gasto */}
          <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon color="primary" />
                Agregar Nuevo Gasto
              </Box>
            </DialogTitle>
            <DialogContent>
              <ExpenseForm onSubmit={handleAddExpense} />
            </DialogContent>
          </Dialog>

          {/* Dialog editar gasto */}
          <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon color="primary" />
                Editar Gasto
              </Box>
            </DialogTitle>
            <DialogContent>
              <ExpenseForm onSubmit={handleUpdateExpense} initialData={expenseEdit} />
            </DialogContent>
          </Dialog>

          {/* Dialog configurar presupuesto */}
          <Dialog open={budgetDialog} onClose={() => setBudgetDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalanceIcon color="primary" />
                Configurar Presupuesto Mensual
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Establece tu presupuesto mensual para recibir alertas cuando te acerques al límite.
              </Typography>
              
              <TextField
                label="Presupuesto mensual"
                type="number"
                fullWidth
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon color="action" />
                    </InputAdornment>
                  ),
                  inputProps: { 
                    min: 0,
                    step: 100,
                    placeholder: '0.00'
                  }
                }}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBudgetDialog(false)}>Cancelar</Button>
              <Button 
                onClick={() => setBudgetDialog(false)} 
                variant="contained"
              >
                Guardar Presupuesto
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}

export default Dashboard; 