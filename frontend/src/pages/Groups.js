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
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  inviteToGroup,
  getPendingInvitations,
  acceptInvitation
} from '../services/groups';

function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState({ open: false, groupId: null });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');

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
      setError('Error al cargar datos');
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
      setSuccess('Grupo creado exitosamente');
    } catch (error) {
      setError('Error al crear grupo');
    }
  };

  const handleInviteToGroup = async () => {
    try {
      await inviteToGroup(inviteDialog.groupId, inviteEmail);
      setInviteDialog({ open: false, groupId: null });
      setInviteEmail('');
      setSuccess('Invitación enviada exitosamente');
    } catch (error) {
      setError('Error al enviar invitación');
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await acceptInvitation(token);
      await loadData(); // Recargar datos
      setSuccess('Te has unido al grupo exitosamente');
    } catch (error) {
      setError('Error al aceptar invitación');
    }
  };

  const handleViewGroupDetails = async (groupId) => {
    try {
      const details = await getGroupDetails(groupId);
      setGroupDetails(details);
      setSelectedGroup(groupId);
    } catch (error) {
      setError('Error al cargar detalles del grupo');
    }
  };

  const GroupCard = ({ group }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <GroupIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {group.name}
          </Typography>
          {group.user_role === 'admin' && (
            <Chip label="Admin" color="primary" size="small" />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {group.description || 'Sin descripción'}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {group.member_count} miembros
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleViewGroupDetails(group.id)}
            >
              Ver detalles
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/groups/${group.id}/expenses`)}
            >
              Ver gastos
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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

      {/* Dialog detalles del grupo */}
      <Dialog 
        open={!!groupDetails} 
        onClose={() => setGroupDetails(null)} 
        maxWidth="md" 
        fullWidth
      >
        {groupDetails && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <GroupIcon />
                {groupDetails.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {groupDetails.description || 'Sin descripción'}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Miembros ({groupDetails.members?.length || 0})
              </Typography>
              
              <List>
                {groupDetails.members?.map((member) => (
                  <ListItem key={member.id}>
                    <ListItemText
                      primary={member.email}
                      secondary={`${member.role} - Unido: ${new Date(member.joined_at).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={member.role} 
                        color={member.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {groupDetails.user_role === 'admin' && (
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={() => {
                      setInviteDialog({ open: true, groupId: groupDetails.id });
                      setGroupDetails(null);
                    }}
                  >
                    Invitar Miembro
                  </Button>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGroupDetails(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
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

export default Groups; 