import { Router } from 'express';
import { addRecurringExpense, listAllRecurringExpenses, pauseRecurringExpense, resumeRecurringExpense, deleteRecurringExpense } from '../controllers/recurringExpenseController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/', authenticateToken, addRecurringExpense);
router.get('/all', authenticateToken, listAllRecurringExpenses);
router.patch('/:id/pause', authenticateToken, pauseRecurringExpense);
router.patch('/:id/resume', authenticateToken, resumeRecurringExpense);
router.delete('/:id', authenticateToken, deleteRecurringExpense);

export default router;