import { Router } from 'express';
import { 
  createGroup,
  getUserGroups,
  getGroupDetails,
  inviteToGroup,
  acceptInvitation,
  getPendingInvitations,
  addGroupExpense,
  getGroupExpenses,
  deleteGroupExpense
} from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// Grupos
router.post('/', authenticateToken, createGroup);
router.get('/', authenticateToken, getUserGroups);
router.get('/:groupId', authenticateToken, getGroupDetails);

// Invitaciones
router.post('/:groupId/invite', authenticateToken, inviteToGroup);
router.post('/invitations/:token/accept', authenticateToken, acceptInvitation);
router.get('/invitations/pending', authenticateToken, getPendingInvitations);

// Gastos de grupos
router.post('/:groupId/expenses', authenticateToken, addGroupExpense);
router.get('/:groupId/expenses', authenticateToken, getGroupExpenses);
router.delete('/:groupId/expenses/:expenseId', authenticateToken, deleteGroupExpense);

export default router; 