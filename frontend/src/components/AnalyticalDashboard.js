import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Savings as SavingsIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  Target as TargetIcon,
  LocalFireDepartment as FireIcon
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
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';

// Colores para gráficos
const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];

// Función para calcular KPIs de ahorro
const calculateSavingsKPIs = (expenses, budget) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Gastos del mes actual
  const currentMonthExpenses = expenses.filter(expense => {
    const date = new Date(expense.fecha);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  const monthlyBudget = budget || 0;
  const savings = monthlyBudget - currentMonthTotal;
  const savingsRate = monthlyBudget > 0 ? (savings / monthlyBudget) * 100 : 0;
  
  // Gastos del mes anterior para comparación
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const previousMonthExpenses = expenses.filter(expense => {
    const date = new Date(expense.fecha);
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
  });
  const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  
  const monthOverMonthChange = previousMonthTotal > 0 ? 
    ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  
  return {
    currentMonthTotal,
    monthlyBudget,
    savings,
    savingsRate,
    monthOverMonthChange,
    daysRemaining: new Date(currentYear, currentMonth + 1, 0).getDate() - new Date().getDate(),
    projectedMonthlyTotal: currentMonthTotal * (30 / (30 - new Date().getDate() + 1))
  };
};

// Función para análisis de gastos por día de la semana
const analyzeWeekdaySpending = (expenses) => {
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const weekdayData = {};
  
  weekdays.forEach((day, index) => {
    weekdayData[index] = {
      day: day,
      total: 0,
      count: 0,
      average: 0,
      dayIndex: index
    };
  });
  
  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const dayIndex = date.getDay();
    weekdayData[dayIndex].total += Number(expense.monto);
    weekdayData[dayIndex].count += 1;
  });
  
  // Calcular promedios
  Object.values(weekdayData).forEach(day => {
    day.average = day.count > 0 ? day.total / day.count : 0;
  });
  
  return Object.values(weekdayData);
};

// Función para crear heatmap de gastos
const createSpendingHeatmap = (expenses) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const heatmapData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.fecha);
      return expenseDate.getDate() === day && 
             expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    const dayTotal = dayExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
    
    heatmapData.push({
      day: day,
      total: dayTotal,
      count: dayExpenses.length,
      intensity: dayTotal > 0 ? Math.min(dayTotal / 100, 1) : 0, // Normalizar intensidad
      date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
    });
  }
  
  return heatmapData;
};

// Función para calcular métricas de grupos
const calculateGroupMetrics = (groups, groupExpenses) => {
  const metrics = {
    totalGroups: groups.length,
    activeGroups: groups.filter(group => group.member_count > 1).length,
    totalMembers: groups.reduce((sum, group) => sum + group.member_count, 0),
    averageGroupSize: groups.length > 0 ? 
      groups.reduce((sum, group) => sum + group.member_count, 0) / groups.length : 0,
    totalGroupExpenses: groupExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0),
    averageExpensePerGroup: groups.length > 0 ? 
      groupExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0) / groups.length : 0
  };
  
  return metrics;
};

// Función para calcular métricas de rendimiento
const calculatePerformanceMetrics = (expenses) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Gastos de los últimos 6 meses
  const monthlyData = {};
  for (let i = 5; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const monthKey = `${year}-${month}`;
    
    const monthExpenses = expenses.filter(expense => {
      const date = new Date(expense.fecha);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    
    monthlyData[monthKey] = {
      month: new Date(year, month).toLocaleDateString('es-ES', { month: 'short' }),
      total: monthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0),
      count: monthExpenses.length,
      average: monthExpenses.length > 0 ? 
        monthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0) / monthExpenses.length : 0
    };
  }
  
  return Object.values(monthlyData);
};

function AnalyticalDashboard({ expenses, groups = [], groupExpenses = [], budget = 0 }) {
  const [activeTab, setActiveTab] = useState(0);

  const analytics = useMemo(() => {
    const savingsKPIs = calculateSavingsKPIs(expenses, budget);
    const weekdayAnalysis = analyzeWeekdaySpending(expenses);
    const heatmapData = createSpendingHeatmap(expenses);
    const groupMetrics = calculateGroupMetrics(groups, groupExpenses);
    const performanceMetrics = calculatePerformanceMetrics(expenses);

    return {
      savingsKPIs,
      weekdayAnalysis,
      heatmapData,
      groupMetrics,
      performanceMetrics
    };
  }, [expenses, groups, groupExpenses, budget]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getIntensityColor = (intensity) => {
    if (intensity === 0) return '#f5f5f5';
    if (intensity < 0.3) return '#ffcdd2';
    if (intensity < 0.6) return '#ef5350';
    if (intensity < 0.8) return '#d32f2f';
    return '#b71c1c';
  };

  return (
    <Box>
      {/* Tabs de navegación */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<SavingsIcon />} label="KPIs de Ahorro" />
          <Tab icon={<CalendarIcon />} label="Análisis Semanal" />
          <Tab icon={<FireIcon />} label="Heatmap" />
          <Tab icon={<GroupIcon />} label="Métricas Grupos" />
          <Tab icon={<SpeedIcon />} label="Rendimiento" />
        </Tabs>
      </Paper>

      {/* Contenido de las tabs */}
      <Box>
        {/* KPIs de Ahorro */}
        {activeTab === 0 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                KPIs de Ahorro y Presupuesto
              </Typography>
              
              <Grid container spacing={3}>
                {/* KPI Principal - Ahorro */}
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Avatar sx={{ bgcolor: analytics.savingsKPIs.savings >= 0 ? 'success.main' : 'error.main' }}>
                            <SavingsIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">Ahorro del Mes</Typography>
                            <Typography variant="h4" color={analytics.savingsKPIs.savings >= 0 ? 'success.main' : 'error.main'}>
                              ${analytics.savingsKPIs.savings.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tasa de Ahorro
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.max(0, Math.min(100, analytics.savingsKPIs.savingsRate))}
                            color={analytics.savingsKPIs.savingsRate >= 0 ? 'success' : 'error'}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {analytics.savingsKPIs.savingsRate.toFixed(1)}% del presupuesto
                          </Typography>
                        </Box>
                        
                        <Alert severity={analytics.savingsKPIs.savings >= 0 ? 'success' : 'warning'}>
                          <Typography variant="body2">
                            {analytics.savingsKPIs.savings >= 0 
                              ? `¡Excelente! Estás ahorrando $${analytics.savingsKPIs.savings.toFixed(2)} este mes`
                              : `Estás gastando $${Math.abs(analytics.savingsKPIs.savings).toFixed(2)} más de tu presupuesto`
                            }
                          </Typography>
                        </Alert>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>

                {/* KPI - Comparación Mensual */}
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Avatar sx={{ bgcolor: analytics.savingsKPIs.monthOverMonthChange <= 0 ? 'success.main' : 'warning.main' }}>
                            <TrendingUpIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">Cambio vs Mes Anterior</Typography>
                            <Typography variant="h4" color={analytics.savingsKPIs.monthOverMonthChange <= 0 ? 'success.main' : 'warning.main'}>
                              {analytics.savingsKPIs.monthOverMonthChange > 0 ? '+' : ''}{analytics.savingsKPIs.monthOverMonthChange.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Gastos del mes actual: ${analytics.savingsKPIs.currentMonthTotal.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Proyección mensual: ${analytics.savingsKPIs.projectedMonthlyTotal.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Alert severity={analytics.savingsKPIs.monthOverMonthChange <= 0 ? 'success' : 'warning'}>
                          <Typography variant="body2">
                            {analytics.savingsKPIs.monthOverMonthChange <= 0 
                              ? '¡Buen trabajo! Has reducido tus gastos'
                              : 'Tus gastos han aumentado este mes'
                            }
                          </Typography>
                        </Alert>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>

                {/* Métricas Detalladas */}
                <Grid item xs={12}>
                  <Slide in={true} timeout={500} direction="up">
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Métricas Detalladas
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              ${analytics.savingsKPIs.monthlyBudget.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Presupuesto Mensual
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              ${analytics.savingsKPIs.currentMonthTotal.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Gastos del Mes
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              {analytics.savingsKPIs.daysRemaining}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Días Restantes
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              {analytics.savingsKPIs.savingsRate.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tasa de Ahorro
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Slide>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Análisis de Gastos por Día de la Semana */}
        {activeTab === 1 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Análisis de Gastos por Día de la Semana
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Gastos por Día de la Semana
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.weekdayAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Bar dataKey="total" fill="#22336c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3, height: 400, overflowY: 'auto' }}>
                      <Typography variant="h6" gutterBottom>
                        Análisis Detallado
                      </Typography>
                      
                      <List>
                        {analytics.weekdayAnalysis.map((day, index) => (
                          <ListItem key={day.day} divider>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: day.total > 0 ? COLORS[index % COLORS.length] : 'grey.300',
                                fontSize: '0.875rem'
                              }}>
                                {day.day.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={day.day}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="primary" fontWeight={600}>
                                    ${day.total.toFixed(2)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {day.count} gastos • Promedio: ${day.average.toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Heatmap de Gastos */}
        {activeTab === 2 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Heatmap de Gastos del Mes
              </Typography>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Intensidad del color indica el monto gastado por día
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mt: 2 }}>
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <Box key={day} textAlign="center" p={1}>
                      <Typography variant="caption" fontWeight={600}>
                        {day}
                      </Typography>
                    </Box>
                  ))}
                  
                  {analytics.heatmapData.map((day, index) => (
                    <Tooltip 
                      key={day.day} 
                      title={`${day.date}: $${day.total.toFixed(2)} (${day.count} gastos)`}
                      arrow
                    >
                      <Box
                        sx={{
                          aspectRatio: '1',
                          bgcolor: getIntensityColor(day.intensity),
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Typography variant="caption" color={day.intensity > 0.5 ? 'white' : 'text.primary'}>
                          {day.day}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Leyenda:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
                      <Box
                        key={intensity}
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: getIntensityColor(intensity),
                          border: '1px solid #e0e0e0',
                          borderRadius: 0.5
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Bajo → Alto
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Fade>
        )}

        {/* Métricas de Grupos */}
        {activeTab === 3 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Métricas de Grupos
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <GroupIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">Resumen de Grupos</Typography>
                            <Typography variant="h4" color="primary">
                              {analytics.groupMetrics.totalGroups}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Grupos Activos
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {analytics.groupMetrics.activeGroups}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Miembros
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {analytics.groupMetrics.totalMembers}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <MoneyIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">Gastos en Grupos</Typography>
                            <Typography variant="h4" color="secondary">
                              ${analytics.groupMetrics.totalGroupExpenses.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Promedio por Grupo
                          </Typography>
                          <Typography variant="h6" color="secondary">
                            ${analytics.groupMetrics.averageExpensePerGroup.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Tamaño promedio: {analytics.groupMetrics.averageGroupSize.toFixed(1)} miembros
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>

                <Grid item xs={12}>
                  <Slide in={true} timeout={500} direction="up">
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Análisis de Grupos
                      </Typography>
                      
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Participación:</strong> {analytics.groupMetrics.activeGroups} de {analytics.groupMetrics.totalGroups} grupos están activos
                        </Typography>
                      </Alert>
                      
                      {analytics.groupMetrics.totalGroups > 0 && (
                        <Alert severity="success">
                          <Typography variant="body2">
                            <strong>Eficiencia:</strong> Promedio de ${analytics.groupMetrics.averageExpensePerGroup.toFixed(2)} por grupo
                          </Typography>
                        </Alert>
                      )}
                    </Paper>
                  </Slide>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Métricas de Rendimiento */}
        {activeTab === 4 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Métricas de Rendimiento
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Tendencia de Gastos (Últimos 6 Meses)
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analytics.performanceMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Bar dataKey="total" fill="#22336c" />
                          <Line type="monotone" dataKey="average" stroke="#f44336" strokeWidth={3} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3, height: 400, overflowY: 'auto' }}>
                      <Typography variant="h6" gutterBottom>
                        Resumen Mensual
                      </Typography>
                      
                      <List>
                        {analytics.performanceMetrics.map((month, index) => (
                          <ListItem key={month.month} divider>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: COLORS[index % COLORS.length],
                                fontSize: '0.875rem'
                              }}>
                                {month.month.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={month.month}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="primary" fontWeight={600}>
                                    ${month.total.toFixed(2)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {month.count} gastos • Promedio: ${month.average.toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
}

export default AnalyticalDashboard; 