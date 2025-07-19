import db from '../models/expense.js';

export const getExpenses = (req, res) => {
  const userId = req.user.id;
  
  // Obtener gastos del usuario y gastos compartidos donde es miembro
  const query = `
    SELECT DISTINCT e.*, u.email as creator_email,
           GROUP_CONCAT(em.user_id) as member_ids,
           GROUP_CONCAT(mu.email) as member_emails
    FROM expenses e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN expense_members em ON e.id = em.expense_id
    LEFT JOIN users mu ON em.user_id = mu.id
    WHERE e.user_id = ? OR e.id IN (
      SELECT expense_id FROM expense_members WHERE user_id = ?
    )
    GROUP BY e.id
    ORDER BY e.fecha DESC, e.id DESC
  `;
  
  db.all(query, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Procesar los resultados para separar miembros
    const expenses = rows.map(row => ({
      ...row,
      member_ids: row.member_ids ? row.member_ids.split(',').map(Number) : [],
      member_emails: row.member_emails ? row.member_emails.split(',') : []
    }));
    
    res.json(expenses);
  });
};

export const addExpense = (req, res) => {
  const { monto, categoria, descripcion, fecha, member_emails } = req.body;
  const userId = req.user.id;
  
  if (!monto || !categoria || !fecha) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.serialize(() => {
    // Insertar el gasto
    db.run(
      'INSERT INTO expenses (monto, categoria, descripcion, fecha, user_id) VALUES (?, ?, ?, ?, ?)',
      [monto, categoria, descripcion || '', fecha, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const expenseId = this.lastID;
        
        // Si hay miembros, agregarlos
        if (member_emails && member_emails.length > 0) {
          const memberEmails = Array.isArray(member_emails) ? member_emails : [member_emails];
          
          memberEmails.forEach(email => {
            // Buscar el usuario por email
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
              if (!err && user && user.id !== userId) {
                // Agregar como miembro
                db.run('INSERT OR IGNORE INTO expense_members (expense_id, user_id) VALUES (?, ?)', 
                  [expenseId, user.id]);
              }
            });
          });
        }
        
        res.status(201).json({ 
          id: expenseId, 
          monto, 
          categoria, 
          descripcion, 
          fecha,
          user_id: userId,
          member_emails: member_emails || []
        });
      }
    );
  });
};

export const deleteExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Verificar que el usuario sea el creador del gasto
  db.get('SELECT user_id FROM expenses WHERE id = ?', [id], (err, expense) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    if (expense.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este gasto' });
    }
    
    db.run('DELETE FROM expenses WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
};

export const updateExpense = (req, res) => {
  const { id } = req.params;
  const { monto, categoria, descripcion, fecha } = req.body;
  const userId = req.user.id;
  
  // Verificar que el usuario sea el creador del gasto
  db.get('SELECT user_id FROM expenses WHERE id = ?', [id], (err, expense) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    if (expense.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para editar este gasto' });
    }
    
    db.run(
      'UPDATE expenses SET monto = ?, categoria = ?, descripcion = ?, fecha = ? WHERE id = ?',
      [monto, categoria, descripcion || '', fecha, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, monto, categoria, descripcion, fecha });
      }
    );
  });
};

// Nuevas funciones para gestionar miembros
export const addMember = (req, res) => {
  const { expenseId } = req.params;
  const { email } = req.body;
  const userId = req.user.id;
  
  // Verificar que el usuario sea el creador del gasto
  db.get('SELECT user_id FROM expenses WHERE id = ?', [expenseId], (err, expense) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    if (expense.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para agregar miembros a este gasto' });
    }
    
    // Buscar el usuario por email
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (user.id === userId) {
        return res.status(400).json({ error: 'No puedes agregarte a ti mismo como miembro' });
      }
      
      // Agregar como miembro
      db.run('INSERT OR IGNORE INTO expense_members (expense_id, user_id) VALUES (?, ?)', 
        [expenseId, user.id], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, member_id: user.id, email });
        });
    });
  });
};

export const removeMember = (req, res) => {
  const { expenseId, memberId } = req.params;
  const userId = req.user.id;
  
  // Verificar que el usuario sea el creador del gasto
  db.get('SELECT user_id FROM expenses WHERE id = ?', [expenseId], (err, expense) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    if (expense.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para quitar miembros de este gasto' });
    }
    
    db.run('DELETE FROM expense_members WHERE expense_id = ? AND user_id = ?', 
      [expenseId, memberId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  });
};

export const getMembers = (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.id;
  
  // Verificar que el usuario tenga acceso al gasto
  db.get(`
    SELECT 1 FROM expenses e 
    LEFT JOIN expense_members em ON e.id = em.expense_id 
    WHERE e.id = ? AND (e.user_id = ? OR em.user_id = ?)
  `, [expenseId, userId, userId], (err, access) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!access) return res.status(403).json({ error: 'No tienes acceso a este gasto' });
    
    db.all(`
      SELECT u.id, u.email, em.created_at as joined_at
      FROM expense_members em
      JOIN users u ON em.user_id = u.id
      WHERE em.expense_id = ?
      ORDER BY em.created_at
    `, [expenseId], (err, members) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(members);
    });
  });
}; 