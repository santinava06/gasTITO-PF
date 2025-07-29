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
  Zoom
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
  Info as InfoIcon
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
  Legend
} from 'recharts';

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

// Función para calcular tendencias temporales
const calculateTemporalTrends = (expenses) => {
  const monthlyData = {};
  const weeklyData = {};
  const dailyData = {};

  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    // Datos mensuales
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: getMonthName(date.getMonth()),
        total: 0,
        count: 0,
        year: date.getFullYear(),
        monthIndex: date.getMonth()
      };
    }
    monthlyData[monthKey].total += Number(expense.monto);
    monthlyData[monthKey].count += 1;

    // Datos semanales
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: `Semana ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`,
        total: 0,
        count: 0
      };
    }
    weeklyData[weekKey].total += Number(expense.monto);
    weeklyData[weekKey].count += 1;

    // Datos diarios
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = {
        date: date.toLocaleDateString('es-ES'),
        total: 0,
        count: 0
      };
    }
    dailyData[dayKey].total += Number(expense.monto);
    dailyData[dayKey].count += 1;
  });

  return {
    monthly: Object.values(monthlyData).sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex),
    weekly: Object.values(weeklyData).slice(-12), // Últimas 12 semanas
    daily: Object.values(dailyData).slice(-30) // Últimos 30 días
  };
};

// Función para analizar patrones de gasto
const analyzeSpendingPatterns = (expenses) => {
  const patterns = {
    categoryPatterns: {},
    dayOfWeekPatterns: {},
    timeOfMonthPatterns: {},
    seasonalPatterns: {}
  };

  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();

    // Patrones por categoría
    if (!patterns.categoryPatterns[expense.categoria]) {
      patterns.categoryPatterns[expense.categoria] = {
        total: 0,
        count: 0,
        average: 0,
        frequency: 0
      };
    }
    patterns.categoryPatterns[expense.categoria].total += Number(expense.monto);
    patterns.categoryPatterns[expense.categoria].count += 1;

    // Patrones por día de la semana
    if (!patterns.dayOfWeekPatterns[dayOfWeek]) {
      patterns.dayOfWeekPatterns[dayOfWeek] = {
        day: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek],
        total: 0,
        count: 0
      };
    }
    patterns.dayOfWeekPatterns[dayOfWeek].total += Number(expense.monto);
    patterns.dayOfWeekPatterns[dayOfWeek].count += 1;

    // Patrones por día del mes
    if (!patterns.timeOfMonthPatterns[dayOfMonth]) {
      patterns.timeOfMonthPatterns[dayOfMonth] = {
        day: dayOfMonth,
        total: 0,
        count: 0
      };
    }
    patterns.timeOfMonthPatterns[dayOfMonth].total += Number(expense.monto);
    patterns.timeOfMonthPatterns[dayOfMonth].count += 1;

    // Patrones estacionales
    if (!patterns.seasonalPatterns[month]) {
      patterns.seasonalPatterns[month] = {
        month: getMonthName(month),
        total: 0,
        count: 0
      };
    }
    patterns.seasonalPatterns[month].total += Number(expense.monto);
    patterns.seasonalPatterns[month].count += 1;
  });

  // Calcular promedios y frecuencias
  Object.keys(patterns.categoryPatterns).forEach(category => {
    const pattern = patterns.categoryPatterns[category];
    pattern.average = pattern.total / pattern.count;
    pattern.frequency = pattern.count / expenses.length;
  });

  return patterns;
};

// Función para comparativas mes vs mes
const calculateMonthComparison = (expenses) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = expenses.filter(expense => {
    const date = new Date(expense.fecha);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const previousMonthExpenses = expenses.filter(expense => {
    const date = new Date(expense.fecha);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
  });

  const currentTotal = currentMonthExpenses.reduce((acc, exp) => acc + Number(exp.monto), 0);
  const previousTotal = previousMonthExpenses.reduce((acc, exp) => acc + Number(exp.monto), 0);

  const difference = currentTotal - previousTotal;
  const percentage = previousTotal > 0 ? ((difference / previousTotal) * 100) : 0;

  return {
    current: {
      total: currentTotal,
      count: currentMonthExpenses.length,
      average: currentMonthExpenses.length > 0 ? currentTotal / currentMonthExpenses.length : 0
    },
    previous: {
      total: previousTotal,
      count: previousMonthExpenses.length,
      average: previousMonthExpenses.length > 0 ? previousTotal / previousMonthExpenses.length : 0
    },
    difference,
    percentage,
    trend: difference > 0 ? 'up' : 'down'
  };
};

// Función para predicciones de gastos futuros
const predictFutureExpenses = (expenses) => {
  const monthlyData = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.fecha);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        total: 0,
        count: 0,
        month: date.getMonth(),
        year: date.getFullYear()
      };
    }
    monthlyData[monthKey].total += Number(expense.monto);
    monthlyData[monthKey].count += 1;
  });

  const monthlyTotals = Object.values(monthlyData)
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map(item => item.total);

  // Calcular tendencia lineal simple
  if (monthlyTotals.length < 2) {
    return {
      nextMonth: monthlyTotals[0] || 0,
      confidence: 'Baja',
      trend: 'Estable'
    };
  }

  const n = monthlyTotals.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = monthlyTotals.reduce((acc, val) => acc + val, 0);
  const sumXY = monthlyTotals.reduce((acc, val, index) => acc + val * (index + 1), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const nextMonthPrediction = slope * (n + 1) + intercept;
  const average = sumY / n;
  const variance = monthlyTotals.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / n;
  const confidence = variance < average * 0.1 ? 'Alta' : variance < average * 0.3 ? 'Media' : 'Baja';

  return {
    nextMonth: Math.max(0, nextMonthPrediction),
    confidence,
    trend: slope > 0 ? 'Creciente' : slope < 0 ? 'Decreciente' : 'Estable',
    slope: slope,
    average: average
  };
};

function AdvancedReports({ expenses }) {
  const [activeTab, setActiveTab] = useState(0);

  const reports = useMemo(() => {
    const temporalTrends = calculateTemporalTrends(expenses);
    const patterns = analyzeSpendingPatterns(expenses);
    const monthComparison = calculateMonthComparison(expenses);
    const predictions = predictFutureExpenses(expenses);

    return {
      temporalTrends,
      patterns,
      monthComparison,
      predictions
    };
  }, [expenses]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Tabs de navegación */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TimelineIcon />} label="Tendencias Temporales" />
          <Tab icon={<AnalyticsIcon />} label="Patrones de Gasto" />
          <Tab icon={<ShowChartIcon />} label="Comparativas" />
          <Tab icon={<AssessmentIcon />} label="Predicciones" />
        </Tabs>
      </Paper>

      {/* Contenido de las tabs */}
      <Box>
        {/* Tendencias Temporales */}
        {activeTab === 0 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Tendencias Temporales
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Tendencia Mensual
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reports.temporalTrends.monthly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#22336c" 
                            strokeWidth={3}
                            dot={{ fill: '#22336c', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Gastos Semanales
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reports.temporalTrends.weekly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Bar dataKey="total" fill="#43a047" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Patrones de Gasto */}
        {activeTab === 1 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Análisis de Patrones
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Gastos por Día de la Semana
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.values(reports.patterns.dayOfWeekPatterns)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Bar dataKey="total" fill="#9c27b0" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Patrones por Categoría
                      </Typography>
                      <Box sx={{ height: '100%', overflowY: 'auto' }}>
                        {Object.entries(reports.patterns.categoryPatterns)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([category, data], index) => (
                            <Box key={category} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {category}
                                </Typography>
                                <Chip 
                                  label={`${(data.frequency * 100).toFixed(1)}%`}
                                  size="small"
                                  color="primary"
                                />
                              </Box>
                              <Typography variant="h6" color="primary">
                                ${data.total.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Promedio: ${data.average.toFixed(2)} | {data.count} gastos
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Comparativas */}
        {activeTab === 2 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Comparativa Mes vs Mes
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        {reports.monthComparison.trend === 'up' ? (
                          <TrendingUpIcon color="error" />
                        ) : (
                          <TrendingDownIcon color="success" />
                        )}
                        <Typography variant="h6">
                          Comparativa con Mes Anterior
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" color="primary">
                                ${reports.monthComparison.current.total.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Este mes
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" color="secondary">
                                ${reports.monthComparison.previous.total.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Mes anterior
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Diferencia
                        </Typography>
                        <Alert 
                          severity={reports.monthComparison.trend === 'up' ? 'error' : 'success'}
                          icon={reports.monthComparison.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        >
                          {reports.monthComparison.trend === 'up' ? '+' : ''}
                          ${reports.monthComparison.difference.toFixed(2)} 
                          ({reports.monthComparison.percentage.toFixed(1)}%)
                        </Alert>
                      </Box>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Comparativa de Promedios
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[
                          {
                            name: 'Este Mes',
                            total: reports.monthComparison.current.total,
                            average: reports.monthComparison.current.average,
                            count: reports.monthComparison.current.count
                          },
                          {
                            name: 'Mes Anterior',
                            total: reports.monthComparison.previous.total,
                            average: reports.monthComparison.previous.average,
                            count: reports.monthComparison.previous.count
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                          <Bar dataKey="total" fill="#22336c" />
                          <Line type="monotone" dataKey="average" stroke="#f44336" strokeWidth={3} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Predicciones */}
        {activeTab === 3 && (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Predicciones de Gastos Futuros
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={300}>
                    <Paper sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <AssessmentIcon color="primary" />
                        <Typography variant="h6">
                          Predicción del Próximo Mes
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" color="primary" gutterBottom>
                          ${reports.predictions.nextMonth.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gasto estimado para el próximo mes
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Nivel de Confianza
                        </Typography>
                        <Chip 
                          label={reports.predictions.confidence}
                          color={reports.predictions.confidence === 'Alta' ? 'success' : 
                                 reports.predictions.confidence === 'Media' ? 'warning' : 'error'}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Basado en la consistencia de los datos históricos
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Tendencia
                        </Typography>
                        <Alert 
                          severity={reports.predictions.trend === 'Creciente' ? 'warning' : 
                                   reports.predictions.trend === 'Decreciente' ? 'success' : 'info'}
                          icon={reports.predictions.trend === 'Creciente' ? <TrendingUpIcon /> : 
                                reports.predictions.trend === 'Decreciente' ? <TrendingDownIcon /> : <InfoIcon />}
                        >
                          {reports.predictions.trend}
                        </Alert>
                      </Box>
                    </Paper>
                  </Zoom>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Zoom in={true} timeout={400}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Recomendaciones
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Promedio histórico:</strong> ${reports.predictions.average.toFixed(2)}
                          </Typography>
                        </Alert>
                        
                        {reports.predictions.trend === 'Creciente' && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Advertencia:</strong> Los gastos muestran una tendencia creciente. 
                              Considera revisar tus hábitos de gasto.
                            </Typography>
                          </Alert>
                        )}
                        
                        {reports.predictions.trend === 'Decreciente' && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>¡Excelente!</strong> Los gastos muestran una tendencia decreciente. 
                              Mantén este buen hábito.
                            </Typography>
                          </Alert>
                        )}
                        
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Consejo:</strong> Revisa regularmente estos reportes para mantener 
                            un control efectivo de tus finanzas.
                          </Typography>
                        </Alert>
                      </Box>
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

export default AdvancedReports; 