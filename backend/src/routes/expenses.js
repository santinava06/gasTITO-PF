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
import { 
  createResourceRateLimit,
  validateExpenseInput,
  handleValidationErrors
} from '../middlewares/security.js';

const router = Router();

// Rate limiting para creación de recursos
router.use(createResourceRateLimit);

// Rutas con validación
router.get('/', authenticateToken, getExpenses);
router.post('/', authenticateToken, validateExpenseInput, handleValidationErrors, addExpense);
router.delete('/:id', authenticateToken, deleteExpense);
router.put('/:id', authenticateToken, validateExpenseInput, handleValidationErrors, updateExpense);

// Rutas para gestionar miembros
router.get('/:expenseId/members', authenticateToken, getMembers);
router.post('/:expenseId/members', authenticateToken, addMember);
router.delete('/:expenseId/members/:memberId', authenticateToken, removeMember);

export default router; 