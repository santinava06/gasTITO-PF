import { Router } from 'express';
import { 
  getExpenses, 
  addExpense, 
  deleteExpense, 
  updateExpense,
  addMember,
  removeMember,
  getMembers
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getExpenses);
router.post('/', authenticateToken, addExpense);
router.delete('/:id', authenticateToken, deleteExpense);
router.put('/:id', authenticateToken, updateExpense);

// Rutas para gestionar miembros
router.get('/:expenseId/members', authenticateToken, getMembers);
router.post('/:expenseId/members', authenticateToken, addMember);
router.delete('/:expenseId/members/:memberId', authenticateToken, removeMember);

export default router; 