import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Fade,
  Zoom
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Función para generar CSV
const generateCSV = (data, filename) => {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para generar PDF (simulada)
const generatePDF = (data, filename) => {
  // En una implementación real, usarías una librería como jsPDF
  alert(`Generando PDF: ${filename}\n\nEsta funcionalidad requiere una librería de PDF como jsPDF.`);
};

// Función para generar Excel (simulada)
const generateExcel = (data, filename) => {
  // En una implementación real, usarías una librería como xlsx
  alert(`Generando Excel: ${filename}\n\nEsta funcionalidad requiere una librería como xlsx.`);
};

function ReportExporter({ expenses, open, onClose }) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');
  const [filename, setFilename] = useState('reporte_gastos');

  const handleExport = () => {
    let filteredExpenses = [...expenses];

    // Filtrar por rango de fechas
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (dateRange) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filteredExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.fecha);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }
    }

    // Preparar datos según el tipo de reporte
    let exportData = [];

    switch (reportType) {
      case 'summary':
        // Resumen por categoría
        const categorySummary = {};
        filteredExpenses.forEach(expense => {
          if (!categorySummary[expense.categoria]) {
            categorySummary[expense.categoria] = { total: 0, count: 0 };
          }
          categorySummary[expense.categoria].total += Number(expense.monto);
          categorySummary[expense.categoria].count += 1;
        });
        
        exportData = Object.entries(categorySummary).map(([category, data]) => ({
          Categoría: category,
          Total: data.total.toFixed(2),
          Cantidad: data.count,
          Promedio: (data.total / data.count).toFixed(2)
        }));
        break;

      case 'detailed':
        // Reporte detallado
        exportData = filteredExpenses.map(expense => ({
          Fecha: expense.fecha,
          Categoría: expense.categoria,
          Descripción: expense.descripcion,
          Monto: expense.monto,
          'Monto Formateado': `$${Number(expense.monto).toFixed(2)}`
        }));
        break;

      case 'monthly':
        // Resumen mensual
        const monthlySummary = {};
        filteredExpenses.forEach(expense => {
          const date = new Date(expense.fecha);
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          const monthName = new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          
          if (!monthlySummary[monthKey]) {
            monthlySummary[monthKey] = {
              month: monthName,
              total: 0,
              count: 0
            };
          }
          monthlySummary[monthKey].total += Number(expense.monto);
          monthlySummary[monthKey].count += 1;
        });
        
        exportData = Object.values(monthlySummary).map(data => ({
          Mes: data.month,
          Total: data.total.toFixed(2),
          Cantidad: data.count,
          Promedio: (data.total / data.count).toFixed(2)
        }));
        break;

      default:
        break;
    }

    // Exportar según el formato
    switch (exportFormat) {
      case 'csv':
        generateCSV(exportData, filename);
        break;
      case 'pdf':
        generatePDF(exportData, filename);
        break;
      case 'excel':
        generateExcel(exportData, filename);
        break;
      default:
        break;
    }

    onClose();
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'summary':
        return 'Resumen de gastos agrupados por categoría con totales y promedios';
      case 'detailed':
        return 'Lista detallada de todos los gastos con información completa';
      case 'monthly':
        return 'Resumen mensual de gastos con totales por mes';
      default:
        return '';
    }
  };

  const getDateRangeDescription = () => {
    switch (dateRange) {
      case 'all':
        return 'Todos los gastos registrados';
      case 'thisMonth':
        return 'Gastos del mes actual';
      case 'lastMonth':
        return 'Gastos del mes anterior';
      case 'thisYear':
        return 'Gastos del año actual';
      case 'custom':
        return `Gastos desde ${customStartDate} hasta ${customEndDate}`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FileDownloadIcon color="primary" />
          Exportar Reporte
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Genera y descarga reportes de tus gastos en diferentes formatos
        </Typography>

        <Grid container spacing={3}>
          {/* Tipo de Reporte */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} timeout={300}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6">Tipo de Reporte</Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo de Reporte</InputLabel>
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      label="Tipo de Reporte"
                    >
                      <MenuItem value="summary">Resumen por Categoría</MenuItem>
                      <MenuItem value="detailed">Reporte Detallado</MenuItem>
                      <MenuItem value="monthly">Resumen Mensual</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="body2" color="text.secondary">
                    {getReportDescription()}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Rango de Fechas */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} timeout={400}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <DateRangeIcon color="primary" />
                    <Typography variant="h6">Rango de Fechas</Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Rango</InputLabel>
                    <Select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      label="Rango"
                    >
                      <MenuItem value="all">Todos los gastos</MenuItem>
                      <MenuItem value="thisMonth">Este mes</MenuItem>
                      <MenuItem value="lastMonth">Mes anterior</MenuItem>
                      <MenuItem value="thisYear">Este año</MenuItem>
                      <MenuItem value="custom">Rango personalizado</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {dateRange === 'custom' && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        label="Fecha de inicio"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        fullWidth
                        sx={{ mb: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Fecha de fin"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    {getDateRangeDescription()}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Formato de Exportación */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} timeout={500}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FileDownloadIcon color="primary" />
                    <Typography variant="h6">Formato de Exportación</Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      label="Formato"
                    >
                      <MenuItem value="csv">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CsvIcon />
                          CSV (Excel compatible)
                        </Box>
                      </MenuItem>
                      <MenuItem value="pdf">
                        <Box display="flex" alignItems="center" gap={1}>
                          <PdfIcon />
                          PDF
                        </Box>
                      </MenuItem>
                      <MenuItem value="excel">
                        <Box display="flex" alignItems="center" gap={1}>
                          <ExcelIcon />
                          Excel
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Nombre del archivo"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    fullWidth
                    helperText="El archivo se descargará con este nombre"
                  />
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Vista Previa */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} timeout={600}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vista Previa
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={`${expenses.length} gastos totales`}
                      color="primary"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      label={`$${expenses.reduce((sum, exp) => sum + Number(exp.monto), 0).toFixed(2)} total`}
                      color="secondary"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                  
                  <Alert severity="info">
                    <Typography variant="body2">
                      El reporte incluirá {expenses.length} gastos por un total de $
                      {expenses.reduce((sum, exp) => sum + Number(exp.monto), 0).toFixed(2)}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleExport} 
          variant="contained"
          startIcon={<FileDownloadIcon />}
        >
          Exportar Reporte
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReportExporter; 