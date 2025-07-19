import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import {
  getGroupDetails,
  getGroupExpenses,
  addGroupExpense,
  deleteGroupExpense
} from '../services/groups';

function GroupExpenses() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [newExpense, setNewExpense] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const categorias = [
    'Alimentos',
    'Transporte',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Otros',
  ];

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const [groupData, expensesData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupExpenses(groupId)
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
    } catch (error) {
      setError('Error al cargar datos del grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      const expense = await addGroupExpense(groupId, newExpense);
      setExpenses([expense, ...expenses]);
      setAddDialog(false);
      setNewExpense({
        monto: '',
        categoria: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      setSuccess('Gasto agregado exitosamente');
    } catch (error) {
      setError('Error al agregar gasto');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteGroupExpense(groupId, expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      setSuccess('Gasto eliminado exitosamente');
    } catch (error) {
      setError('Error al eliminar gasto');
    }
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.monto), 0);
  const expensesByUser = expenses.reduce((acc, exp) => {
    acc[exp.paid_by_email] = (acc[exp.paid_by_email] || 0) + Number(exp.monto);
    return acc;
  }, {});

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Cargando...</Typography>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">Grupo no encontrado</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/groups')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom>
            {group.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {group.description || 'Sin descripción'}
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Gastado
              </Typography>
              <Typography variant="h4" color="primary">
                ${totalExpenses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Miembros
              </Typography>
              <Typography variant="h4" color="secondary">
                {group.members?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gastos
              </Typography>
              <Typography variant="h4" color="info.main">
                {expenses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gastos por usuario */}
      {Object.keys(expensesByUser).length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Gastos por Miembro
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(expensesByUser).map(([email, amount]) => (
              <Grid item xs={12} sm={6} md={4} key={email}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                    {email}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${amount.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Botón agregar gasto */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Gastos del Grupo ({expenses.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog(true)}
        >
          Agregar Gasto
        </Button>
      </Box>

      {/* Tabla de gastos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Pagado por</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay gastos registrados en este grupo
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.fecha}</TableCell>
                  <TableCell>
                    <Chip label={expense.categoria} size="small" />
                  </TableCell>
                  <TableCell>{expense.descripcion}</TableCell>
                  <TableCell>{expense.paid_by_email}</TableCell>
                  <TableCell align="right">${expense.monto}</TableCell>
                  <TableCell align="center">
                    {expense.paid_by_email === group.user?.email && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog agregar gasto */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Gasto al Grupo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Monto"
                type="number"
                fullWidth
                value={newExpense.monto}
                onChange={(e) => setNewExpense({ ...newExpense, monto: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categoría"
                fullWidth
                value={newExpense.categoria}
                onChange={(e) => setNewExpense({ ...newExpense, categoria: e.target.value })}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                value={newExpense.descripcion}
                onChange={(e) => setNewExpense({ ...newExpense, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={newExpense.fecha}
                onChange={(e) => setNewExpense({ ...newExpense, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAddExpense}
            variant="contained"
            disabled={!newExpense.monto || !newExpense.categoria || !newExpense.fecha}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default GroupExpenses; 