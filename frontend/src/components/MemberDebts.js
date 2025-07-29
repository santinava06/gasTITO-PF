import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Fade,
  Zoom,
  Slide
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Función para calcular deudas entre miembros
const calculateMemberDebts = (expenses, members) => {
  console.log('calculateMemberDebts - expenses:', expenses);
  console.log('calculateMemberDebts - members:', members);
  
  if (!expenses || !members || expenses.length === 0 || members.length === 0) {
    console.log('calculateMemberDebts - datos insuficientes');
    return {
      totalExpenses: 0,
      averagePerPerson: 0,
      memberBalances: [],
      debts: []
    };
  }

  // Calcular total de gastos
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  const averagePerPerson = totalExpenses / members.length;

  // Calcular balance de cada miembro
  const memberBalances = members.map(member => {
    const memberExpenses = expenses.filter(expense => expense.paid_by === member.id);
    const totalSpent = memberExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
    const balance = totalSpent - averagePerPerson;
    
    console.log(`Member ${member.email}: spent ${totalSpent}, balance ${balance}`);
    
    return {
      ...member,
      userId: member.id, // Agregar userId para compatibilidad
      totalSpent,
      balance,
      expenseCount: memberExpenses.length,
      averageExpense: memberExpenses.length > 0 ? totalSpent / memberExpenses.length : 0
    };
  });

  // Calcular deudas entre miembros
  const debts = [];
  const creditors = memberBalances.filter(member => member.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = memberBalances.filter(member => member.balance < 0).sort((a, b) => a.balance - b.balance);

  // Crear copias para no modificar los originales
  const creditorsCopy = creditors.map(c => ({ ...c }));
  const debtorsCopy = debtors.map(d => ({ ...d }));

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditorsCopy.length && debtorIndex < debtorsCopy.length) {
    const creditor = creditorsCopy[creditorIndex];
    const debtor = debtorsCopy[debtorIndex];
    
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
    
    if (amount > 0.01) { // Evitar deudas muy pequeñas
      debts.push({
        from: debtors[debtorIndex], // Usar el original para mostrar
        to: creditors[creditorIndex], // Usar el original para mostrar
        amount: amount
      });
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (creditor.balance <= 0.01) creditorIndex++;
      if (debtor.balance >= -0.01) debtorIndex++;
    } else {
      break;
    }
  }

  return {
    totalExpenses,
    averagePerPerson,
    memberBalances,
    debts
  };
};

// Función para obtener iniciales del nombre
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

function MemberDebts({ expenses, members, groupName }) {
  const debtAnalysis = useMemo(() => {
    console.log('MemberDebts - expenses:', expenses);
    console.log('MemberDebts - members:', members);
    const result = calculateMemberDebts(expenses, members);
    console.log('MemberDebts - debtAnalysis:', result);
    return result;
  }, [expenses, members]);

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'success';
    if (balance < 0) return 'error';
    return 'default';
  };

  const getBalanceIcon = (balance) => {
    if (balance > 0) return <TrendingUpIcon />;
    if (balance < 0) return <TrendingDownIcon />;
    return <CheckCircleIcon />;
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Fade in={true} timeout={500}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay gastos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega gastos para ver el análisis de deudas entre miembros
          </Typography>
        </Paper>
      </Fade>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Análisis de Deudas - {groupName}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Distribución equitativa de gastos entre {members.length} miembros
      </Typography>

      {/* Resumen General */}
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
                      ${debtAnalysis.totalExpenses.toFixed(2)}
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
                    <AccountBalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Promedio por Persona</Typography>
                    <Typography variant="h4" color="secondary">
                      ${debtAnalysis.averagePerPerson.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {members.length} miembros en el grupo
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
                  <Avatar sx={{ bgcolor: debtAnalysis.debts.length > 0 ? 'warning.main' : 'success.main' }}>
                    <SwapHorizIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Deudas Pendientes</Typography>
                    <Typography variant="h4" color={debtAnalysis.debts.length > 0 ? 'warning.main' : 'success.main'}>
                      {debtAnalysis.debts.length}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {debtAnalysis.debts.length > 0 ? 'Transacciones necesarias' : 'Todos cuadrados'}
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Balance de Miembros */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Slide in={true} timeout={600} direction="up">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Balance de Miembros
              </Typography>
              
              <List>
                {debtAnalysis.memberBalances.map((member, index) => (
                  <Fade in={true} timeout={300 + index * 100} key={member.id}>
                    <ListItem divider>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: getBalanceColor(member.balance) === 'success' ? 'success.main' : 
                                   getBalanceColor(member.balance) === 'error' ? 'error.main' : 'grey.500'
                        }}>
                          {getInitials(member.name || member.email)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight={600}>
                              {member.name || member.email}
                            </Typography>
                            <Chip
                              icon={getBalanceIcon(member.balance)}
                              label={`$${member.balance.toFixed(2)}`}
                              color={getBalanceColor(member.balance)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Gastó: ${member.totalSpent.toFixed(2)} • {member.expenseCount} gastos
                            </Typography>
                            {member.expenseCount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Promedio: ${member.averageExpense.toFixed(2)} por gasto
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </Paper>
          </Slide>
        </Grid>

        <Grid item xs={12} md={6}>
          <Slide in={true} timeout={700} direction="up">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Deudas Pendientes
              </Typography>
              
              {debtAnalysis.debts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    ¡Todos cuadrados!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Los gastos están perfectamente distribuidos entre todos los miembros
                  </Typography>
                </Box>
              ) : (
                <List>
                  {debtAnalysis.debts.map((debt, index) => (
                    <Fade in={true} timeout={400 + index * 100} key={`${debt.from.id}-${debt.to.id}`}>
                      <ListItem divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <SwapHorizIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={600}>
                              {debt.from.name || debt.from.email} → {debt.to.name || debt.to.email}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="h6" color="warning.main" fontWeight={600}>
                                ${debt.amount.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Deuda pendiente por pagar
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              )}
            </Paper>
          </Slide>
        </Grid>
      </Grid>

      {/* Alertas y Recomendaciones */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Análisis y Recomendaciones
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {debtAnalysis.debts.length > 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Deudas pendientes:</strong> Hay {debtAnalysis.debts.length} transacciones necesarias para equilibrar los gastos
                </Typography>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>¡Perfecto!</strong> Los gastos están perfectamente distribuidos entre todos los miembros
                </Typography>
              </Alert>
            )}
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Promedio por persona:</strong> ${debtAnalysis.averagePerPerson.toFixed(2)} 
                (${debtAnalysis.totalExpenses.toFixed(2)} ÷ {members.length} miembros)
              </Typography>
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Total de gastos:</strong> ${debtAnalysis.totalExpenses.toFixed(2)} 
                distribuidos en {expenses.length} transacciones
              </Typography>
            </Alert>
            
            {debtAnalysis.memberBalances.some(member => member.expenseCount === 0) && (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Atención:</strong> Algunos miembros no han registrado gastos aún
                </Typography>
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default MemberDebts; 