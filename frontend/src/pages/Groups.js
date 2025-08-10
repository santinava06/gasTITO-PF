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
  Zoom,
  Avatar,
  Divider,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Celebration as CelebrationIcon
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
  const theme = useTheme();
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
  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
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
      setGroupDetails(details);
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

  const GroupCard = ({ group, index }) => {
    const [totalGastos, setTotalGastos] = useState(null);
    const colorIndex = index % COLORS.length;
    const gradientColor = COLORS[colorIndex];

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
      <Zoom in={true} timeout={300 + index * 100}>
        <Card
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            cursor: 'pointer', 
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: `linear-gradient(135deg, ${alpha(gradientColor, 0.1)} 0%, ${alpha(gradientColor, 0.05)} 100%)`,
            border: `1px solid ${alpha(gradientColor, 0.2)}`,
            '&:hover': { 
              boxShadow: `0 8px 32px ${alpha(gradientColor, 0.3)}`,
              transform: 'translateY(-4px) scale(1.02)',
              border: `1px solid ${alpha(gradientColor, 0.4)}`
            }
          }}
          elevation={2}
          onClick={() => navigate(`/groups/${group.id}/expenses`)}
          tabIndex={0}
          role="button"
          aria-label={`Ver grupo ${group.name}`}
        >
          <CardContent sx={{ flexGrow: 1, p: 3 }}>
            {/* Header con gradiente */}
            <Box 
              sx={{ 
                background: `linear-gradient(135deg, ${gradientColor} 0%, ${alpha(gradientColor, 0.8)} 100%)`,
                borderRadius: 2,
                p: 2,
                mb: 2,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                <GroupIcon sx={{ fontSize: 60 }} />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {group.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {group.description || 'Sin descripción'}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 48, 
                    height: 48,
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <GroupIcon />
                </Avatar>
              </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PeopleIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>{group.member_count}</strong> miembros
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon color="success" sx={{ fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>{totalGastos === null ? '...' : `$${totalGastos.toLocaleString()}`}</strong> total
                </Typography>
              </Box>
            </Box>

            {/* Role Badge */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {group.user_role === 'owner' && (
                <Chip 
                  icon={<SecurityIcon />}
                  label="Propietario" 
                  color="warning" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {group.user_role === 'admin' && (
                <Chip 
                  icon={<AdminIcon />}
                  label="Administrador" 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {group.user_role === 'member' && (
                <Chip 
                  icon={<PersonIcon />}
                  label="Miembro" 
                  color="default" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            {/* Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
              <Tooltip title="Ver detalles del grupo" arrow>
                <IconButton 
                  size="small" 
                  sx={{ 
                    color: gradientColor,
                    '&:hover': { 
                      bgcolor: alpha(gradientColor, 0.1),
                      transform: 'scale(1.1)'
                    }
                  }}
                  onClick={e => { 
                    e.stopPropagation(); 
                    handleViewGroupDetails(group.id); 
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              
              {(group.user_role === 'owner' || group.user_role === 'admin') && (
                <Tooltip title="Eliminar grupo" arrow>
                  <IconButton 
                    size="small" 
                    color="error"
                    sx={{ 
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
                    }}
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
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  const InvitationCard = ({ invitation, index }) => (
    <Fade in={true} timeout={500 + index * 100}>
      <Card 
        sx={{ 
          mb: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CelebrationIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {invitation.group_name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Invitado por: <strong>{invitation.invited_by_email}</strong>
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GroupIcon />}
              onClick={() => handleAcceptInvitation(invitation.token)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  transform: 'scale(1.05)'
                }
              }}
            >
              Aceptar
            </Button>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* Header mejorado */}
          <Box 
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderRadius: 3,
              p: 4,
              mb: 4,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <GroupIcon sx={{ fontSize: 120 }} />
            </Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              Grupos de Gastos
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Gestiona tus grupos de gastos compartidos de manera eficiente
            </Typography>
          </Box>

          {/* Invitaciones pendientes */}
          {invitations.length > 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CelebrationIcon color="warning" sx={{ fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Invitaciones Pendientes ({invitations.length})
                </Typography>
              </Box>
              {invitations.map((invitation, index) => (
                <InvitationCard key={invitation.id} invitation={invitation} index={index} />
              ))}
            </Paper>
          )}

          {/* Sección de grupos */}
          <Box 
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.6)} 100%)`,
              borderRadius: 3,
              p: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}
          >
            {/* Header de grupos */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Mis Grupos ({groups.length})
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Organiza y gestiona tus gastos compartidos
                </Typography>
              </Box>
              <Tooltip title="Crear nuevo grupo" arrow>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialog(true)}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  Crear Grupo
                </Button>
              </Tooltip>
            </Box>

            {/* Lista de grupos */}
            <Grid container spacing={3}>
              {groups.map((group, index) => (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  <GroupCard group={group} index={index} />
                </Grid>
              ))}
            </Grid>

            {groups.length === 0 && !loading && (
              <Paper 
                sx={{ 
                  p: 6, 
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 0.3)} 100%)`,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}
              >
                <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  No tienes grupos aún
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Crea un grupo para comenzar a compartir gastos con otros
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialog(true)}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600
                  }}
                >
                  Crear Primer Grupo
                </Button>
              </Paper>
            )}
          </Box>

          {/* Dialog crear grupo mejorado */}
          <Dialog 
            open={createDialog} 
            onClose={() => setCreateDialog(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <CreateIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Crear Nuevo Grupo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organiza gastos compartidos
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setCreateDialog(false)}
                sx={{ px: 3 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                variant="contained"
                disabled={!isGroupFormValid() || createLoading}
                startIcon={createLoading ? <CreateIcon /> : <CreateIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  px: 3,
                  fontWeight: 600
                }}
              >
                {createLoading ? 'Creando...' : 'Crear Grupo'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog invitar a grupo mejorado */}
          <Dialog 
            open={inviteDialog.open} 
            onClose={() => setInviteDialog({ open: false, groupId: null })} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <SendIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Invitar a Grupo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comparte con otros
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setInviteDialog({ open: false, groupId: null })}
                sx={{ px: 3 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleInviteToGroup} 
                variant="contained"
                disabled={!isInviteFormValid() || inviteLoading}
                startIcon={inviteLoading ? <SendIcon /> : <SendIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  px: 3,
                  fontWeight: 600
                }}
              >
                {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog detalles del grupo mejorado */}
          <Dialog 
            open={!!groupDetails} 
            onClose={() => setGroupDetails(null)} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Detalles del Grupo: {groupDetails?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Información completa del grupo
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {groupDetails && (
                <Box>
                  <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Descripción:</strong> {groupDetails.description || 'Sin descripción'}
                    </Typography>
                  </Paper>
                  
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Miembros del Grupo ({groupDetails.members?.length || 0})
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Rol</strong></TableCell>
                          <TableCell><strong>Fecha de Unión</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupDetails.members?.map((member) => (
                          <TableRow key={member.id} hover>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              <Chip 
                                label={member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Miembro'} 
                                color={member.role === 'owner' ? 'warning' : member.role === 'admin' ? 'primary' : 'default'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {new Date(member.joined_at).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Creado por:</strong> {groupDetails.creator_email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fecha de creación:</strong> {new Date(groupDetails.created_at).toLocaleDateString('es-AR')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setGroupDetails(null)}
                sx={{ px: 3 }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}

export default Groups; 