import { Router } from 'express';
import expensesRouter from './expenses.js';
import authRouter from './auth.js';
import groupsRouter from './groups.js';

const router = Router();

router.use('/api/expenses', expensesRouter);
router.use('/api/auth', authRouter);
router.use('/api/groups', groupsRouter);

export default router; 