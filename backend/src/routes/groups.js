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
  deleteGroupExpense,
  updateMemberRole,
  deleteGroup,
  updateGroupExpense
} from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { 
  createResourceRateLimit,
  readResourceRateLimit,
  validateGroupInput,
  validateExpenseInput,
  handleValidationErrors
} from '../middlewares/security.js';

const router = Router();

// Grupos
router.post('/', authenticateToken, createResourceRateLimit, validateGroupInput, handleValidationErrors, createGroup);
router.get('/', authenticateToken, readResourceRateLimit, getUserGroups);
router.get('/:groupId', authenticateToken, readResourceRateLimit, getGroupDetails);

// Eliminar grupo
router.delete('/:groupId', authenticateToken, createResourceRateLimit, deleteGroup);

// Invitaciones
router.post('/:groupId/invite', authenticateToken, createResourceRateLimit, inviteToGroup);
router.post('/invitations/:token/accept', authenticateToken, createResourceRateLimit, acceptInvitation);
router.get('/invitations/pending', authenticateToken, readResourceRateLimit, getPendingInvitations);

// Gastos de grupos
router.post('/:groupId/expenses', authenticateToken, createResourceRateLimit, validateExpenseInput, handleValidationErrors, addGroupExpense);
router.get('/:groupId/expenses', authenticateToken, readResourceRateLimit, getGroupExpenses);
router.delete('/:groupId/expenses/:expenseId', authenticateToken, createResourceRateLimit, deleteGroupExpense);
router.put('/:groupId/expenses/:expenseId', authenticateToken, createResourceRateLimit, validateExpenseInput, handleValidationErrors, updateGroupExpense);

// Cambiar rol de miembro
router.patch('/:groupId/members/:userId/role', authenticateToken, createResourceRateLimit, updateMemberRole);

export default router; 