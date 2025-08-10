import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { logUserAction, logSecurityEvent } from '../utils/auditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'finanzas.db');
const db = new sqlite3.Database(dbPath);

// Obtener presupuestos del usuario
export const getUserBudgets = (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT b.*, 
           COALESCE(SUM(bc.spent), 0) as total_spent,
           COALESCE(SUM(bc.amount), 0) as total_budget
    FROM budgets b
    LEFT JOIN budget_categories bc ON b.id = bc.budget_id
    WHERE b.user_id = ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;
  
  db.all(query, [userId], (err, budgets) => {
    if (err) {
      logSecurityEvent('BUDGET_FETCH_ERROR', {
        userId: userId,
        error: err.message
      });
      return res.status(500).json({ error: 'Error al obtener presupuestos' });
    }
    
    // Calcular porcentaje de uso para cada presupuesto
    const budgetsWithProgress = budgets.map(budget => ({
      ...budget,
      progress: budget.total_budget > 0 ? (budget.total_spent / budget.total_budget) * 100 : 0,
      remaining: budget.total_budget - budget.total_spent
    }));
    
    res.json(budgetsWithProgress);
  });
};

// Crear nuevo presupuesto
export const createBudget = (req, res) => {
  const userId = req.user.id;
  const { name, amount, period, start_date, end_date, categories } = req.body;
  
  if (!name || !amount || !start_date) {
    return res.status(400).json({ error: 'Nombre, monto y fecha de inicio son requeridos' });
  }
  
  db.run(`
    INSERT INTO budgets (user_id, name, amount, period, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, name, amount, period || 'monthly', start_date, end_date], function(err) {
    if (err) {
      logSecurityEvent('BUDGET_CREATE_ERROR', {
        userId: userId,
        error: err.message
      });
      return res.status(500).json({ error: 'Error al crear presupuesto' });
    }
    
    const budgetId = this.lastID;
    
    // Crear categorías si se proporcionan
    if (categories && categories.length > 0) {
      const categoryValues = categories.map(cat => [budgetId, cat.category, cat.amount]);
      const placeholders = categories.map(() => '(?, ?, ?)').join(',');
      
      db.run(`
        INSERT INTO budget_categories (budget_id, category, amount)
        VALUES ${placeholders}
      `, categoryValues.flat(), (err) => {
        if (err) {
          console.error('Error al crear categorías:', err);
        }
      });
    }
    
    logUserAction('BUDGET_CREATED', userId, {
      budgetId: budgetId,
      name: name,
      amount: amount
    });
    
    res.status(201).json({ 
      message: 'Presupuesto creado exitosamente',
      budgetId: budgetId 
    });
  });
};

// Obtener detalles de un presupuesto
export const getBudgetDetails = (req, res) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  
  // Obtener información del presupuesto
  db.get(`
    SELECT * FROM budgets 
    WHERE id = ? AND user_id = ?
  `, [budgetId, userId], (err, budget) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener presupuesto' });
    }
    
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    // Obtener categorías del presupuesto
    db.all(`
      SELECT * FROM budget_categories 
      WHERE budget_id = ?
      ORDER BY amount DESC
    `, [budgetId], (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener categorías' });
      }
      
      // Calcular totales
      const totalBudget = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
      
      res.json({
        ...budget,
        categories: categories,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        progress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        remaining: totalBudget - totalSpent
      });
    });
  });
};

// Actualizar presupuesto
export const updateBudget = (req, res) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  const { name, amount, period, start_date, end_date } = req.body;
  
  db.run(`
    UPDATE budgets 
    SET name = ?, amount = ?, period = ?, start_date = ?, end_date = ?
    WHERE id = ? AND user_id = ?
  `, [name, amount, period, start_date, end_date, budgetId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar presupuesto' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    logUserAction('BUDGET_UPDATED', userId, {
      budgetId: budgetId,
      name: name
    });
    
    res.json({ message: 'Presupuesto actualizado exitosamente' });
  });
};

// Eliminar presupuesto
export const deleteBudget = (req, res) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  
  db.run(`
    DELETE FROM budgets 
    WHERE id = ? AND user_id = ?
  `, [budgetId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar presupuesto' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    logUserAction('BUDGET_DELETED', userId, {
      budgetId: budgetId
    });
    
    res.json({ message: 'Presupuesto eliminado exitosamente' });
  });
};

// Obtener presupuestos de grupo
export const getGroupBudgets = (req, res) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;
  
  // Verificar que el usuario es miembro del grupo
  db.get(`
    SELECT 1 FROM group_members 
    WHERE group_id = ? AND user_id = ?
  `, [groupId, userId], (err, member) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar membresía' });
    }
    
    if (!member) {
      return res.status(403).json({ error: 'No tienes acceso a este grupo' });
    }
    
    // Obtener presupuestos del grupo
    const query = `
      SELECT gb.*, 
             COALESCE(SUM(gbc.spent), 0) as total_spent,
             COALESCE(SUM(gbc.amount), 0) as total_budget
      FROM group_budgets gb
      LEFT JOIN group_budget_categories gbc ON gb.id = gbc.budget_id
      WHERE gb.group_id = ?
      GROUP BY gb.id
      ORDER BY gb.created_at DESC
    `;
    
    db.all(query, [groupId], (err, budgets) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener presupuestos del grupo' });
      }
      
      const budgetsWithProgress = budgets.map(budget => ({
        ...budget,
        progress: budget.total_budget > 0 ? (budget.total_spent / budget.total_budget) * 100 : 0,
        remaining: budget.total_budget - budget.total_spent
      }));
      
      res.json(budgetsWithProgress);
    });
  });
}; 