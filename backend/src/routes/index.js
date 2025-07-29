import { Router } from 'express';
import expensesRouter from './expenses.js';
import authRouter from './auth.js';
import groupsRouter from './groups.js';
import twoFactorRouter from './twoFactor.js';
import recurringExpensesRouter from './recurringExpenses.js';

const router = Router();

router.use('/expenses', expensesRouter);
router.use('/auth', authRouter);
router.use('/groups', groupsRouter);
router.use('/2fa', twoFactorRouter);
router.use('/recurring-expenses', recurringExpensesRouter);

export default router; 