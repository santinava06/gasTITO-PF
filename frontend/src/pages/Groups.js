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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Card,
  CardContent,
  Divider,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  inviteToGroup,
  getPendingInvitations,
  acceptInvitation,
  getGroupExpenses,
  deleteGroup
} from '../services/groups';
import { useSnackbar } from '../context/SnackbarContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsData, invitationsData] = await Promise.all([
        getUserGroups(),
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

  const handleCreateGroup = async () => {
    try {
      const group = await createGroup(newGroup);
      setGroups([group, ...groups]);
      setCreateDialog(false);
      setNewGroup({ name: '', description: '' });
      showSuccess('Grupo creado exitosamente');
    } catch (error) {
      showError('Error al crear grupo');
    }
  };

  const handleInviteToGroup = async () => {
    try {
      await inviteToGroup(inviteDialog.groupId, inviteEmail);
      setInviteDialog({ open: false, groupId: null });
      setInviteEmail('');
      showSuccess('Invitación enviada exitosamente');
    } catch (error) {
      showError('Error al enviar invitación');
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await acceptInvitation(token);
      await loadData();
      showSuccess('Te has unido al grupo exitosamente');
    } catch (error) {
      showError('Error al aceptar invitación');
    }
  };

  const handleViewGroupDetails = async (groupId) => {
    try {
      setLoadingExpenses(true);
      const details = await getGroupDetails(groupId);
      setGroupDetails(details);
      setSelectedGroup(groupId);
      // Obtener gastos del grupo y calcular por miembro
      const gastos = await getGroupExpenses(groupId);
      const byMember = {};
      gastos.forEach(g => {
        if (!byMember[g.paid_by_email]) byMember[g.paid_by_email] = 0;
        byMember[g.paid_by_email] += Number(g.monto);
      });
      setExpensesByMember(Object.entries(byMember).map(([email, monto]) => ({ email, monto })));
    } catch (error) {
      showError('Error al cargar detalles del grupo');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.')) return;
    try {
      await deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      showSuccess('Grupo eliminado');
    } catch {
      showError('No se pudo eliminar el grupo');
    }
  };

  const GroupCard = ({ group }) => {
    const [totalGastos, setTotalGastos] = React.useState(null);
    React.useEffect(() => {
      let mounted = true;
      getGroupExpenses(group.id)
        .then(gastos => {
          if (mounted) {
            const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
            setTotalGastos(total);
          }
        })
        .catch(() => setTotalGastos(null));
      return () => { mounted = false; };
    }, [group.id]);

    return (
      <Paper
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6, bgcolor: '#f4f6fa' } }}
        elevation={3}
        onClick={() => navigate(`/groups/${group.id}/expenses`)}
        tabIndex={0}
        role="button"
        aria-label={`Ver grupo ${group.name}`}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <GroupIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {group.name}
            </Typography>
            {group.user_role === 'owner' && (
              <Chip label="Propietario" color="warning" size="small" />
            )}
            {group.user_role === 'admin' && (
              <Chip label="Admin" color="primary" size="small" />
            )}
            {(group.user_role === 'owner' || group.user_role === 'admin') && (
              <IconButton
                size="small"
                color="error"
                sx={{ ml: 1 }}
                onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                title="Eliminar grupo"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {group.description || 'Sin descripción'}
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Miembros: <b>{group.member_count}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total gastos: <b>{totalGastos === null ? '...' : `$${totalGastos}`}</b>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Paper>
    );
  };

  const InvitationCard = ({ invitation }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {invitation.group_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invitado por: {invitation.invited_by_email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(invitation.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleAcceptInvitation(invitation.token)}
          >
            Aceptar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Crear Grupo
        </Button>
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

      {/* Dialog crear grupo */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Grupo</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre del grupo"
            fullWidth
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Descripción (opcional)"
            fullWidth
            multiline
            rows={3}
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!newGroup.name.trim()}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog invitar a grupo */}
      <Dialog open={inviteDialog.open} onClose={() => setInviteDialog({ open: false, groupId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Invitar a Grupo</DialogTitle>
        <DialogContent>
          <TextField
            label="Email del invitado"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog({ open: false, groupId: null })}>Cancelar</Button>
          <Button 
            onClick={handleInviteToGroup} 
            variant="contained"
            disabled={!inviteEmail.trim()}
          >
            Invitar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Eliminar el modal de detalles del grupo y toda la lógica asociada. */}
    </Container>
  );
}

export default Groups; 