import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Tabs,
  Tab,
  Fade,
  Zoom,
  Divider,
  Container,
  Button,
  Tooltip
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  FileDownload as FileDownloadIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { fetchExpenses } from '../services/expenses';
import { getGroups, getAllGroupExpenses } from '../services/groups';
import { useSnackbar } from '../context/SnackbarContext';
import { SectionLoading } from '../components/LoadingSpinner';
import AdvancedReports from '../components/AdvancedReports';
import ReportExporter from '../components/ReportExporter';
import AnalyticalDashboard from '../components/AnalyticalDashboard';

// Colores para gráficos
const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];

// Función para agrupar gastos por categoría
const groupByCategory = (expenses) => {
  const grouped = {};
  expenses.forEach(expense => {
    if (!grouped[expense.categoria]) {
      grouped[expense.categoria] = 0;
    }
    grouped[expense.categoria] += Number(expense.monto);
  });
  
  return Object.entries(grouped).map(([categoria, monto]) => ({
    categoria,
    monto
  }));
};

// Función para calcular estadísticas básicas
const calculateBasicStats = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  const average = expenses.length > 0 ? total / expenses.length : 0;
  const categories = [...new Set(expenses.map(expense => expense.categoria))];
  
  // Gastos del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(expense => {
    const date = new Date(expense.fecha);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);

  return {
    total,
    average,
    count: expenses.length,
    categories: categories.length,
    currentMonthTotal,
    currentMonthCount: currentMonthExpenses.length
  };
};

function Reportes() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [exportDialog, setExportDialog] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [userBudget, setUserBudget] = useState(0);
  const { showError } = useSnackbar();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, budget, groupsData, groupExpensesData] = await Promise.all([
        fetchExpenses(),
        Promise.resolve(localStorage.getItem('userBudget') || 0),
        getGroups().catch(() => []), // Si falla, usar array vacío
        getAllGroupExpenses().catch(() => []) // Si falla, usar array vacío
      ]);
      
      setExpenses(expensesData);
      setUserBudget(Number(budget));
      setGroups(groupsData);
      setGroupExpenses(groupExpensesData);
    } catch (error) {
      setError('No se pudieron cargar los datos');
      showError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Mostrar loading mientras carga
  if (loading) {
    return <SectionLoading section="reports" />;
  }

  const data = groupByCategory(expenses);
  const stats = calculateBasicStats(expenses);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Reportes Avanzados
              </Typography>
              
              <Typography variant="subtitle1" color="text.secondary">
                Análisis detallado de tus gastos y predicciones financieras
              </Typography>
            </Box>
            
            <Tooltip title="Exportar reportes" arrow>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => setExportDialog(true)}
              >
                Exportar
              </Button>
            </Tooltip>
          </Box>

          {/* Estadísticas rápidas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} timeout={300}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AssessmentIcon color="primary" />
                      <Typography variant="h6">Total Gastos</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${stats.total.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.count} gastos registrados
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
                      <TrendingUpIcon color="primary" />
                      <Typography variant="h6">Promedio</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${stats.average.toFixed(2)}
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
                      <PieChartIcon color="primary" />
                      <Typography variant="h6">Categorías</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {stats.categories}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Diferentes categorías
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
                      <TimelineIcon color="primary" />
                      <Typography variant="h6">Este Mes</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${stats.currentMonthTotal.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.currentMonthCount} gastos
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>

          {/* Tabs de navegación */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab icon={<PieChartIcon />} label="Resumen Básico" />
              <Tab icon={<AnalyticsIcon />} label="Reportes Avanzados" />
              <Tab icon={<DashboardIcon />} label="Dashboard Analítico" />
            </Tabs>
          </Paper>

          {/* Contenido de las tabs */}
          <Box>
            {/* Resumen Básico */}
            {activeTab === 0 && (
              <Fade in={true} timeout={500}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Resumen por Categorías
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Zoom in={true} timeout={300}>
                        <Paper elevation={3} sx={{ p: 3, width: '100%', minHeight: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {error ? (
                            <Typography color="error">{error}</Typography>
                          ) : data.length === 0 ? (
                            <Typography>No hay datos para mostrar.</Typography>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={data}
                                  dataKey="monto"
                                  nameKey="categoria"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  label={({ categoria, percent }) => `${categoria} (${(percent * 100).toFixed(0)}%)`}
                                >
                                  {data.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </Paper>
                      </Zoom>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Zoom in={true} timeout={400}>
                        <Paper sx={{ p: 3, height: 350, overflowY: 'auto' }}>
                          <Typography variant="h6" gutterBottom>
                            Detalle por Categoría
                          </Typography>
                          
                          {data.length === 0 ? (
                            <Typography color="text.secondary">
                              No hay gastos registrados para mostrar.
                            </Typography>
                          ) : (
                            <Box>
                              {data.map((item, index) => (
                                <Box key={item.categoria} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {item.categoria}
                                    </Typography>
                                    <Chip 
                                      label={`${((item.monto / stats.total) * 100).toFixed(1)}%`}
                                      size="small"
                                      sx={{ 
                                        backgroundColor: COLORS[index % COLORS.length] + '20',
                                        color: COLORS[index % COLORS.length]
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="h6" color="primary">
                                    ${item.monto.toFixed(2)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {((item.monto / stats.total) * 100).toFixed(1)}% del total
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Paper>
                      </Zoom>
                    </Grid>
                  </Grid>

                  {/* Alertas y recomendaciones */}
                  {data.length > 0 && (
                    <Paper sx={{ p: 3, mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Análisis y Recomendaciones
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Gasto promedio:</strong> ${stats.average.toFixed(2)} por transacción
                            </Typography>
                          </Alert>
                          
                          {stats.average > 100 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>Advertencia:</strong> Tu gasto promedio es alto. Considera revisar tus hábitos de consumo.
                              </Typography>
                            </Alert>
                          )}
                          
                          {stats.categories < 3 && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>Sugerencia:</strong> Diversifica tus gastos en más categorías para un mejor control.
                              </Typography>
                            </Alert>
                          )}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Este mes:</strong> ${stats.currentMonthTotal.toFixed(2)} ({stats.currentMonthCount} gastos)
                            </Typography>
                          </Alert>
                          
                          {stats.currentMonthTotal > stats.total / 12 && (
                            <Alert severity="warning">
                              <Typography variant="body2">
                                <strong>Atención:</strong> Los gastos de este mes están por encima del promedio mensual.
                              </Typography>
                            </Alert>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                </Box>
              </Fade>
            )}

            {/* Reportes Avanzados */}
            {activeTab === 1 && (
              <Fade in={true} timeout={500}>
                <Box>
                  <AdvancedReports expenses={expenses} />
                </Box>
              </Fade>
            )}

            {/* Dashboard Analítico */}
            {activeTab === 2 && (
              <Fade in={true} timeout={500}>
                <Box>
                  <AnalyticalDashboard 
                    expenses={expenses}
                    groups={groups}
                    groupExpenses={groupExpenses}
                    budget={userBudget}
                  />
                </Box>
              </Fade>
            )}
          </Box>

          {/* Dialog de exportación */}
          <ReportExporter 
            expenses={expenses}
            open={exportDialog}
            onClose={() => setExportDialog(false)}
          />
        </Box>
      </Fade>
    </Container>
  );
}

export default Reportes; 