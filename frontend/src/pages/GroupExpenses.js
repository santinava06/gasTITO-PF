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
  Card,
  CardContent,
  Chip,
  MenuItem,
  Tooltip,
  Card as MuiCard
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
  deleteGroupExpense,
  inviteToGroup,
  updateGroupExpense
} from '../services/groups';
import { useSnackbar } from '../context/SnackbarContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Paper as MuiPaper, Avatar } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { updateMemberRole } from '../services/groups';
import { Edit as EditIcon } from '@mui/icons-material';

function GroupExpenses() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const categorias = [
    'Alimentos',
    'Transporte',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Otros',
  ];
  const { showSuccess, showError } = useSnackbar();
  const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];
  const { user } = useAuth();
  const [roleLoading, setRoleLoading] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [expenseEdit, setExpenseEdit] = useState(null);

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
      showError('Error al cargar datos del grupo');
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
      showSuccess('Gasto agregado exitosamente');
    } catch (error) {
      showError('Error al agregar gasto');
    }
  };

  const handleEditExpense = (expense) => {
    setExpenseEdit(expense);
    setEditDialog(true);
  };

  const handleUpdateExpense = async (data) => {
    try {
      const actualizado = await updateGroupExpense(groupId, expenseEdit.id, data);
      setExpenses(expenses.map(e => e.id === expenseEdit.id ? actualizado : e));
      setEditDialog(false);
      setExpenseEdit(null);
      showSuccess('Gasto actualizado correctamente');
    } catch {
      showError('Error al actualizar gasto');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    try {
      await deleteGroupExpense(groupId, expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      showSuccess('Gasto eliminado exitosamente');
    } catch {
      showError('Error al eliminar gasto');
    }
  };

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      await inviteToGroup(groupId, inviteEmail);
      setInviteDialog(false);
      setInviteEmail('');
      showSuccess('Invitación enviada exitosamente');
    } catch {
      showError('Error al enviar invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.monto), 0);
  const expensesByUser = expenses.reduce((acc, exp) => {
    acc[exp.paid_by_email] = (acc[exp.paid_by_email] || 0) + Number(exp.monto);
    return acc;
  }, {});

  // Función para obtener iniciales de un email
  function getInitials(email) {
    if (!email) return '';
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const expensesByMemberArr = Object.entries(expensesByUser).map(([email, monto]) => ({ email, monto, initials: getInitials(email) }));

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
        <Box flexGrow={1} />
        <Button variant="outlined" onClick={() => setInviteDialog(true)}>
          Invitar miembro
        </Button>
      </Box>

      {/* Resumen visual, gráfico y deudas */}
      <MuiPaper elevation={3} sx={{ p: 3, mb: 4, background: '#f4f6fa' }}>
        {/* Gráfico de barras ocupando todo el ancho */}
        <Box width="100%" mb={2}>
          <Typography variant="h6" gutterBottom>Gasto por miembro</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expensesByMemberArr} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="initials" tick={{ fontSize: 16 }} interval={0} />
              <YAxis />
              <Tooltip
                formatter={(value, name, props) => [`$${value}`, 'Gasto']}
                labelFormatter={(label, payload) => {
                  if (!payload || !payload[0]) return label;
                  const { email } = payload[0].payload;
                  return `${label} (${email})`;
                }}
              />
              <Bar dataKey="monto" name="Gasto" fill="#22336c" label={{ position: 'top', formatter: v => `$${v}` }}>
                {expensesByMemberArr.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        {/* KPIs en tarjetas */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={4}>
            <MuiCard elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary">Total gastado</Typography>
              <Typography variant="h5" color="primary">${totalExpenses.toLocaleString()}</Typography>
            </MuiCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <MuiCard elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary">Miembros</Typography>
              <Typography variant="h5" color="secondary">{group.members?.length || 0}</Typography>
            </MuiCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <MuiCard elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary">Gastos registrados</Typography>
              <Typography variant="h5" color="info.main">{expenses.length}</Typography>
            </MuiCard>
          </Grid>
        </Grid>
        {/* Fila de avatares de miembros */}
        {/* Reemplazar la fila de avatares de miembros por una visualización más elegante y responsiva */}
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={3} mb={2}>
          {group.members?.map((member) => {
            const isOwner = member.role === 'owner';
            return (
              <Box key={member.id} display="flex" flexDirection="column" alignItems="center" position="relative" sx={{ minWidth: 90 }}>
                <Tooltip title={`${member.email} (${isOwner ? 'Propietario' : member.role})`} arrow>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: isOwner ? 'warning.main' : member.role === 'admin' ? 'primary.main' : 'secondary.main', fontSize: 22, mb: 1, boxShadow: 2 }}>
                    {getInitials(member.email)}
                  </Avatar>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.email.split('@')[0]}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'center', color: isOwner ? 'warning.main' : member.role === 'admin' ? 'primary.main' : 'text.secondary' }}>
                  {isOwner ? 'Propietario' : member.role === 'admin' ? 'Admin' : 'Miembro'}
                </Typography>
                {/* Control de rol solo para admin/owner y no a sí mismo, y transferir propiedad solo si soy owner y el otro no es owner */}
                {group.user_role === 'owner' && !isOwner && user?.id !== member.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 60,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 2,
                      display: { xs: 'none', sm: 'block', md: 'block' },
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'auto',
                      '&:hover, &:focus, &:active': { opacity: 1 },
                      '&:hover': { opacity: 1 },
                      width: 120,
                    }}
                    className="member-role-hover"
                  >
                    <Paper elevation={4} sx={{ p: 1, mt: 0.5, minWidth: 100 }}>
                      <TextField
                        select
                        size="small"
                        value={member.role}
                        onChange={async (e) => {
                          setRoleLoading(member.id);
                          try {
                            await updateMemberRole(groupId, member.id, e.target.value);
                            showSuccess('Rol actualizado');
                            await loadGroupData();
                          } catch {
                            showError('Error al actualizar rol');
                          } finally {
                            setRoleLoading(null);
                          }
                        }}
                        sx={{ minWidth: 90 }}
                        disabled={roleLoading === member.id}
                      >
                        <MenuItem value="member">Miembro</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="owner">Propietario</MenuItem>
                      </TextField>
                    </Paper>
                  </Box>
                )}
                {/* Si soy admin pero no owner, solo puedo cambiar entre admin/miembro */}
                {group.user_role === 'admin' && !isOwner && user?.id !== member.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 60,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 2,
                      display: { xs: 'none', sm: 'block', md: 'block' },
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'auto',
                      '&:hover, &:focus, &:active': { opacity: 1 },
                      '&:hover': { opacity: 1 },
                      width: 100,
                    }}
                    className="member-role-hover"
                  >
                    <Paper elevation={4} sx={{ p: 1, mt: 0.5, minWidth: 90 }}>
                      <TextField
                        select
                        size="small"
                        value={member.role}
                        onChange={async (e) => {
                          setRoleLoading(member.id);
                          try {
                            await updateMemberRole(groupId, member.id, e.target.value);
                            showSuccess('Rol actualizado');
                            await loadGroupData();
                          } catch {
                            showError('Error al actualizar rol');
                          } finally {
                            setRoleLoading(null);
                          }
                        }}
                        sx={{ minWidth: 80 }}
                        disabled={roleLoading === member.id}
                      >
                        <MenuItem value="member">Miembro</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </TextField>
                    </Paper>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        {/* Deudas entre miembros (igual que antes) */}
        <Box mt={4}>
          <Typography variant="subtitle1" gutterBottom>Deudas entre miembros</Typography>
          <MuiPaper elevation={2} sx={{ p: 2, mb: 2, background: '#f4f6fa' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InfoIcon color="info" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Cada miembro debería aportar la misma cantidad. Si alguien pagó de más, el resto le debe la diferencia.
              </Typography>
            </Box>
            {expensesByMemberArr.length === 0 ? (
              <Typography>No hay datos para calcular deudas.</Typography>
            ) : (
              (() => {
                const totalGasto = expensesByMemberArr.reduce((acc, m) => acc + m.monto, 0);
                const miembros = group.members?.map(m => m.email) || [];
                const cuota = miembros.length > 0 ? totalGasto / miembros.length : 0;
                const balances = miembros.map(email => {
                  const pagado = expensesByMemberArr.find(m => m.email === email)?.monto || 0;
                  return { email, pagado, debe: +(cuota - pagado).toFixed(2) };
                });
                let debtors = balances.filter(b => b.debe > 0).map(b => ({ ...b }));
                let creditors = balances.filter(b => b.debe < 0).map(b => ({ ...b, debe: -b.debe }));
                const settlements = [];
                for (let d of debtors) {
                  let amount = d.debe;
                  for (let c of creditors) {
                    if (amount === 0) break;
                    const pay = Math.min(amount, c.debe);
                    if (pay > 0) {
                      settlements.push({ from: d.email, to: c.email, amount: pay });
                      c.debe -= pay;
                      amount -= pay;
                    }
                  }
                }
                if (settlements.length === 0) {
                  return <Typography color="success.main">No hay deudas pendientes. Todos están equilibrados.</Typography>;
                }
                return (
                  <Box>
                    {settlements.map((s, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 14 }}>
                          {s.from[0].toUpperCase()}
                        </Avatar>
                        <ArrowForwardIcon color="action" fontSize="small" />
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 14 }}>
                          {s.to[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          <b>{s.from}</b> le debe <b style={{ color: '#43a047' }}>${s.amount.toFixed(2)}</b> a <b>{s.to}</b>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })()
            )}
          </MuiPaper>
        </Box>
      </MuiPaper>

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
              expenses.map((expense) => {
                const canEditOrDelete = group.user_role === 'owner' || group.user_role === 'admin';
                return (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.fecha}</TableCell>
                    <TableCell>
                      <Chip label={expense.categoria} size="small" />
                    </TableCell>
                    <TableCell>{expense.descripcion}</TableCell>
                    <TableCell>{expense.paid_by_email}</TableCell>
                    <TableCell align="right">${expense.monto}</TableCell>
                    <TableCell align="center">
                      {canEditOrDelete && (
                        <>
                          <IconButton color="primary" size="small" onClick={() => handleEditExpense(expense)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
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

      {/* Modal de edición de gasto */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Gasto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Monto"
                type="number"
                fullWidth
                value={expenseEdit?.monto || ''}
                onChange={e => setExpenseEdit({ ...expenseEdit, monto: e.target.value })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categoría"
                fullWidth
                value={expenseEdit?.categoria || ''}
                onChange={e => setExpenseEdit({ ...expenseEdit, categoria: e.target.value })}
              >
                {categorias.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                value={expenseEdit?.descripcion || ''}
                onChange={e => setExpenseEdit({ ...expenseEdit, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={expenseEdit?.fecha || ''}
                onChange={e => setExpenseEdit({ ...expenseEdit, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button
            onClick={() => handleUpdateExpense(expenseEdit)}
            variant="contained"
            disabled={!expenseEdit?.monto || !expenseEdit?.categoria || !expenseEdit?.fecha}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog invitar miembro */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Invitar a Grupo</DialogTitle>
        <DialogContent>
          <TextField
            label="Email del invitado"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteEmail.trim() || inviteLoading}
          >
            {inviteLoading ? 'Enviando...' : 'Invitar'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Agregar estilos globales para mostrar el control de rol al hacer hover en el avatar */}
      <style>{`
        .member-role-hover { pointer-events: none; }
        .member-role-hover:hover, .member-role-hover:focus, .member-role-hover:active {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .MuiAvatar-root:hover + .member-role-hover {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </Container>
  );
}

export default GroupExpenses; 