import { Router } from 'express';
import { 
  getUserBudgets, 
  createBudget, 
  getBudgetDetails, 
  updateBudget, 
  deleteBudget,
  getGroupBudgets 
} from '../controllers/budgetController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateBudgetInput, handleValidationErrors } from '../middlewares/security.js';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de presupuestos personales
router.get('/', getUserBudgets);
router.post('/', validateBudgetInput, handleValidationErrors, createBudget);
router.get('/:id', getBudgetDetails);
router.put('/:id', validateBudgetInput, handleValidationErrors, updateBudget);
router.delete('/:id', deleteBudget);

// Rutas de presupuestos de grupos
router.get('/group/:groupId', getGroupBudgets);

export default router; 