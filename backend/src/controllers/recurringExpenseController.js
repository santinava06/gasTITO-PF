import * as RecurringExpense from '../models/recurringExpense.js';

export const addRecurringExpense = (req, res) => {
  const data = { ...req.body, created_by: req.user.id };
  RecurringExpense.createRecurringExpense(data, (err, expense) => {
    if (err) return res.status(500).json({ error: 'Error al crear gasto recurrente' });
    res.status(201).json(expense);
  });
};

export const listAllRecurringExpenses = (req, res) => {
  RecurringExpense.listAllRecurringExpenses(req.user.id, (err, expenses) => {
    if (err) return res.status(500).json({ error: 'Error al listar gastos recurrentes' });
    res.json(expenses);
  });
};

export const pauseRecurringExpense = (req, res) => {
  RecurringExpense.pauseRecurringExpense(req.params.id, (err, expense) => {
    if (err) return res.status(500).json({ error: 'Error al pausar gasto recurrente' });
    res.json(expense);
  });
};

export const resumeRecurringExpense = (req, res) => {
  RecurringExpense.resumeRecurringExpense(req.params.id, (err, expense) => {
    if (err) return res.status(500).json({ error: 'Error al reanudar gasto recurrente' });
    res.json(expense);
  });
};

export const deleteRecurringExpense = (req, res) => {
  RecurringExpense.deleteRecurringExpense(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar gasto recurrente' });
    res.json({ success: true });
  });
};