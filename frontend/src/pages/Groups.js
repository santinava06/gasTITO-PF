import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  InputAdornment,
  Fade,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  createGroup,
  getGroups,
  getGroupDetails,
  getGroupExpenses,
  inviteToGroup,
  getPendingInvitations,
  acceptInvitation,
  deleteGroup
} from '../services/groups';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import { SectionLoading } from '../components/LoadingSpinner';

function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState({ open: false, groupId: null });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const { showSuccess, showError } = useSnackbar();
  const COLORS = ['#22336c', '#43a047', '#fbc02d', '#e57373', '#6b7280', '#8e24aa', '#00838f'];
  const [expensesByMember, setExpensesByMember] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const { user } = useAuth();

  // Estados para validación de formularios
  const [groupErrors, setGroupErrors] = useState({});
  const [groupTouched, setGroupTouched] = useState({});
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviteTouched, setInviteTouched] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, invitationsData] = await Promise.all([
        getGroups(),
        getPendingInvitations()
      ]);
      setGroups(groupsData);
      setInvitations(invitationsData);
    } catch (error) {
      showError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Validación para formulario de crear grupo
  const validateGroupField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return 'El nombre del grupo es requerido';
        if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (value.length > 50) return 'El nombre no puede exceder 50 caracteres';
        return '';
      
      case 'description':
        if (value && value.length > 200) return 'La descripción no puede exceder 200 caracteres';
        return '';
      
      default:
        return '';
    }
  };

  // Validación para formulario de invitar
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

  const handleGroupChange = (e) => {
    const { name, value } = e.target;
    setNewGroup(prev => ({ ...prev, [name]: value }));
    
    if (groupTouched[name]) {
      const error = validateGroupField(name, value);
      setGroupErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleGroupBlur = (name) => {
    setGroupTouched(prev => ({ ...prev, [name]: true }));
    const error = validateGroupField(name, newGroup[name]);
    setGroupErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setInviteEmail(value);
    
    if (inviteTouched[name]) {
      const error = validateInviteField(name, value);
      setInviteErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleInviteBlur = (name) => {
    setInviteTouched(prev => ({ ...prev, [name]: true }));
    const error = validateInviteField(name, inviteEmail);
    setInviteErrors(prev => ({ ...prev, [name]: error }));
  };

  const isGroupFormValid = () => {
    return Object.keys(newGroup).every(field => {
      const error = validateGroupField(field, newGroup[field]);
      return !error;
    });
  };

  const isInviteFormValid = () => {
    const error = validateInviteField('email', inviteEmail);
    return !error;
  };

  const handleCreateGroup = async () => {
    // Validar formulario
    const newErrors = {};
    Object.keys(newGroup).forEach(key => {
      const error = validateGroupField(key, newGroup[key]);
      if (error) newErrors[key] = error;
    });
    
    setGroupErrors(newErrors);
    setGroupTouched({ name: true, description: true });

    if (Object.keys(newErrors).length === 0) {
      setCreateLoading(true);
      try {
        const group = await createGroup(newGroup);
        setGroups([group, ...groups]);
        setCreateDialog(false);
        setNewGroup({ name: '', description: '' });
        setGroupErrors({});
        setGroupTouched({});
        showSuccess('Grupo creado exitosamente');
      } catch (error) {
        showError('Error al crear grupo');
      } finally {
        setCreateLoading(false);
      }
    }
  };

  const handleInviteToGroup = async () => {
    // Validar formulario
    const error = validateInviteField('email', inviteEmail);
    setInviteErrors({ email: error });
    setInviteTouched({ email: true });

    if (!error) {
      setInviteLoading(true);
      try {
        await inviteToGroup(inviteDialog.groupId, inviteEmail);
        setInviteDialog({ open: false, groupId: null });
        setInviteEmail('');
        setInviteErrors({});
        setInviteTouched({});
        showSuccess('Invitación enviada exitosamente');
      } catch (error) {
        showError('Error al enviar invitación');
      } finally {
        setInviteLoading(false);
      }
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await acceptInvitation(token);
      showSuccess('Invitación aceptada');
      loadData();
    } catch (error) {
      showError('Error al aceptar invitación');
    }
  };

  const handleViewGroupDetails = async (groupId) => {
    setLoadingExpenses(true);
    try {
      const [details, expensesResponse] = await Promise.all([
        getGroupDetails(groupId),
        getGroupExpenses(groupId)
      ]);
      setSelectedGroup(details);
      // Handle the new response structure: { expenses, pagination }
      const expenses = expensesResponse.expenses || expensesResponse;
      setExpensesByMember(expenses);
    } catch (error) {
      showError('Error al cargar detalles del grupo');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este grupo?')) return;
    try {
      await deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      showSuccess('Grupo eliminado exitosamente');
    } catch (error) {
      showError('Error al eliminar grupo');
    }
  };

  const GroupCard = ({ group }) => {
    const [totalGastos, setTotalGastos] = useState(null);

    useEffect(() => {
      const loadGroupExpenses = async () => {
        try {
          const response = await getGroupExpenses(group.id);
          // Handle the new response structure: { expenses, pagination }
          const expenses = response.expenses || response;
          const total = expenses.reduce((acc, exp) => acc + Number(exp.monto), 0);
          setTotalGastos(total);
        } catch (error) {
          console.error('Error loading group expenses:', error);
        }
      };
      loadGroupExpenses();
    }, [group.id]);

    return (
      <Zoom in={true} timeout={300}>
        <Paper
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            '&:hover': { 
              boxShadow: 6, 
              bgcolor: '#f4f6fa',
              transform: 'translateY(-2px)'
            }
          }}
          elevation={3}
          onClick={() => navigate(`/groups/${group.id}/expenses`)}
          tabIndex={0}
          role="button"
          aria-label={`Ver grupo ${group.name}`}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <GroupIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{group.name}</Typography>
              {group.user_role === 'owner' && (<Chip label="Propietario" color="warning" size="small" />)}
              {group.user_role === 'admin' && (<Chip label="Admin" color="primary" size="small" />)}
              {(group.user_role === 'owner' || group.user_role === 'admin') && (
                <Tooltip title="Eliminar grupo" arrow>
                  <IconButton 
                    size="small" 
                    color="error" 
                    sx={{ ml: 1 }} 
                    onClick={e => { 
                      e.stopPropagation(); 
                      handleDeleteGroup(group.id); 
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{group.description || 'Sin descripción'}</Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Miembros: <b>{group.member_count}</b></Typography>
                <Typography variant="body2" color="text.secondary">Total gastos: <b>{totalGastos === null ? '...' : `$${totalGastos}`}</b></Typography>
              </Box>
              <Tooltip title="Ver detalles del grupo" arrow>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={e => { 
                    e.stopPropagation(); 
                    handleViewGroupDetails(group.id); 
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Paper>
      </Zoom>
    );
  };

  const InvitationCard = ({ invitation }) => (
    <Fade in={true} timeout={500}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">{invitation.group_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Invitado por: {invitation.invited_by_email}
              </Typography>
            </Box>
            <Tooltip title="Aceptar invitación" arrow>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleAcceptInvitation(invitation.token)}
              >
                Aceptar
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  // Mostrar loading mientras carga
  if (loading) {
    return <SectionLoading section="groups" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Grupos de Gastos
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Gestiona tus grupos de gastos compartidos
          </Typography>

          {/* Invitaciones pendientes */}
          {invitations.length > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Invitaciones Pendientes ({invitations.length})
              </Typography>
              {invitations.map((invitation) => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))}
            </Paper>
          )}

          {/* Botón crear grupo */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">
              Mis Grupos ({groups.length})
            </Typography>
            <Tooltip title="Crear nuevo grupo" arrow>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialog(true)}
              >
                Crear Grupo
              </Button>
            </Tooltip>
          </Box>

          {/* Lista de grupos */}
          <Grid container spacing={3}>
            {groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <GroupCard group={group} />
              </Grid>
            ))}
          </Grid>

          {groups.length === 0 && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes grupos aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crea un grupo para comenzar a compartir gastos con otros
              </Typography>
            </Paper>
          )}

          {/* Dialog crear grupo mejorado */}
          <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <CreateIcon color="primary" />
                Crear Nuevo Grupo
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crea un grupo para compartir gastos con familiares, amigos o compañeros.
              </Typography>
              
              <TextField
                label="Nombre del grupo"
                name="name"
                fullWidth
                value={newGroup.name}
                onChange={handleGroupChange}
                onBlur={() => handleGroupBlur('name')}
                error={!!groupErrors.name}
                helperText={groupErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon color="action" />
                    </InputAdornment>
                  ),
                  placeholder: 'Ej: Vacaciones 2024'
                }}
                sx={{ mb: 3, mt: 1 }}
              />
              
              <TextField
                label="Descripción (opcional)"
                name="description"
                fullWidth
                multiline
                rows={3}
                value={newGroup.description}
                onChange={handleGroupChange}
                onBlur={() => handleGroupBlur('description')}
                error={!!groupErrors.description}
                helperText={groupErrors.description || 'Describe el propósito del grupo'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                  placeholder: 'Ej: Gastos compartidos para las vacaciones familiares'
                }}
              />

              {/* Mostrar errores generales */}
              {Object.keys(groupErrors).some(key => groupErrors[key]) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Por favor, corrige los errores en el formulario antes de continuar.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateGroup} 
                variant="contained"
                disabled={!isGroupFormValid() || createLoading}
                startIcon={createLoading ? <CreateIcon /> : <CreateIcon />}
              >
                {createLoading ? 'Creando...' : 'Crear Grupo'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog invitar a grupo mejorado */}
          <Dialog open={inviteDialog.open} onClose={() => setInviteDialog({ open: false, groupId: null })} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SendIcon color="primary" />
                Invitar a Grupo
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Invita a alguien a unirse a tu grupo de gastos compartidos.
              </Typography>
              
              <TextField
                label="Email del invitado"
                name="email"
                type="email"
                fullWidth
                value={inviteEmail}
                onChange={handleInviteChange}
                onBlur={() => handleInviteBlur('email')}
                error={!!inviteErrors.email}
                helperText={inviteErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                  placeholder: 'amigo@email.com'
                }}
                sx={{ mt: 1 }}
              />

              {/* Mostrar errores generales */}
              {Object.keys(inviteErrors).some(key => inviteErrors[key]) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Por favor, corrige los errores en el formulario antes de continuar.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInviteDialog({ open: false, groupId: null })}>Cancelar</Button>
              <Button 
                onClick={handleInviteToGroup} 
                variant="contained"
                disabled={!isInviteFormValid() || inviteLoading}
                startIcon={inviteLoading ? <SendIcon /> : <SendIcon />}
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

export default Groups; 