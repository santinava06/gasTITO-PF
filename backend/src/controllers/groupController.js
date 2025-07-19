import db from '../models/expense.js';
import crypto from 'crypto';

// Crear un nuevo grupo
export const createGroup = (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'El nombre del grupo es requerido' });
  }

  db.run(
    'INSERT INTO expense_groups (name, description, created_by) VALUES (?, ?, ?)',
    [name, description || '', userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const groupId = this.lastID;
      
      // Agregar al creador como miembro del grupo
      db.run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)', 
        [groupId, userId, 'admin'], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          res.status(201).json({ 
            id: groupId, 
            name, 
            description, 
            created_by: userId,
            message: 'Grupo creado exitosamente'
          });
        });
    }
  );
};

// Obtener grupos del usuario
export const getUserGroups = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT eg.*, u.email as creator_email,
           COUNT(gm.user_id) as member_count,
           CASE WHEN gm.user_id = ? THEN gm.role ELSE NULL END as user_role
    FROM expense_groups eg
    LEFT JOIN users u ON eg.created_by = u.id
    LEFT JOIN group_members gm ON eg.id = gm.group_id
    WHERE eg.id IN (
      SELECT group_id FROM group_members WHERE user_id = ?
    )
    GROUP BY eg.id
    ORDER BY eg.created_at DESC
  `;

  db.all(query, [userId, userId], (err, groups) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(groups);
  });
};

// Obtener detalles de un grupo específico
export const getGroupDetails = (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Verificar que el usuario sea miembro del grupo
  db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', 
    [groupId, userId], (err, membership) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!membership) return res.status(403).json({ error: 'No tienes acceso a este grupo' });

      // Obtener información del grupo
      db.get(`
        SELECT eg.*, u.email as creator_email
        FROM expense_groups eg
        LEFT JOIN users u ON eg.created_by = u.id
        WHERE eg.id = ?
      `, [groupId], (err, group) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

        // Obtener miembros del grupo
        db.all(`
          SELECT u.id, u.email, gm.role, gm.joined_at
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = ?
          ORDER BY gm.joined_at
        `, [groupId], (err, members) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            ...group,
            members,
            user_role: membership.role
          });
        });
      });
    });
};

// Invitar a alguien al grupo
export const inviteToGroup = (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body;
  const userId = req.user.id;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  // Verificar que el usuario sea admin del grupo
  db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', 
    [groupId, userId], (err, membership) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden invitar miembros' });
      }

      // Verificar que el email no esté ya invitado
      db.get('SELECT * FROM group_invitations WHERE group_id = ? AND email = ? AND status = "pending"', 
        [groupId, email], (err, existingInvitation) => {
          if (err) return res.status(500).json({ error: err.message });
          if (existingInvitation) {
            return res.status(400).json({ error: 'Ya existe una invitación pendiente para este email' });
          }

          // Verificar que el usuario no sea ya miembro
          db.get('SELECT u.id FROM users u JOIN group_members gm ON u.id = gm.user_id WHERE u.email = ? AND gm.group_id = ?', 
            [email, groupId], (err, existingMember) => {
              if (err) return res.status(500).json({ error: err.message });
              if (existingMember) {
                return res.status(400).json({ error: 'Este usuario ya es miembro del grupo' });
              }

              // Crear token único para la invitación
              const token = crypto.randomBytes(32).toString('hex');
              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 días

              // Crear la invitación
              db.run(`
                INSERT INTO group_invitations (group_id, email, invited_by, token, expires_at)
                VALUES (?, ?, ?, ?, ?)
              `, [groupId, email, userId, token, expiresAt], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.json({ 
                  success: true, 
                  message: 'Invitación enviada exitosamente',
                  invitation_id: this.lastID,
                  token
                });
              });
            });
        });
    });
};

// Aceptar invitación a grupo
export const acceptInvitation = (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;

  // Verificar que la invitación existe y es válida
  db.get(`
    SELECT gi.*, eg.name as group_name
    FROM group_invitations gi
    JOIN expense_groups eg ON gi.group_id = eg.id
    WHERE gi.token = ? AND gi.status = 'pending' AND gi.expires_at > datetime('now')
  `, [token], (err, invitation) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitación no válida o expirada' });
    }

    // Verificar que el usuario no sea ya miembro
    db.get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', 
      [invitation.group_id, userId], (err, existingMember) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existingMember) {
          return res.status(400).json({ error: 'Ya eres miembro de este grupo' });
        }

        // Agregar al usuario como miembro
        db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', 
          [invitation.group_id, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Marcar invitación como aceptada
            db.run('UPDATE group_invitations SET status = "accepted" WHERE id = ?', 
              [invitation.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({ 
                  success: true, 
                  message: `Te has unido exitosamente al grupo "${invitation.group_name}"`
                });
              });
          });
      });
  });
};

// Obtener invitaciones pendientes del usuario
export const getPendingInvitations = (req, res) => {
  const userEmail = req.user.email;

  const query = `
    SELECT gi.*, eg.name as group_name, u.email as invited_by_email
    FROM group_invitations gi
    JOIN expense_groups eg ON gi.group_id = eg.id
    JOIN users u ON gi.invited_by = u.id
    WHERE gi.email = ? AND gi.status = 'pending' AND gi.expires_at > datetime('now')
    ORDER BY gi.created_at DESC
  `;

  db.all(query, [userEmail], (err, invitations) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(invitations);
  });
};

// Agregar gasto a un grupo
export const addGroupExpense = (req, res) => {
  const { groupId } = req.params;
  const { monto, categoria, descripcion, fecha, split_type } = req.body;
  const userId = req.user.id;

  if (!monto || !categoria || !fecha) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Verificar que el usuario sea miembro del grupo
  db.get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', 
    [groupId, userId], (err, membership) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!membership) {
        return res.status(403).json({ error: 'No tienes acceso a este grupo' });
      }

      db.run(`
        INSERT INTO group_expenses (group_id, monto, categoria, descripcion, fecha, paid_by, split_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [groupId, monto, categoria, descripcion || '', fecha, userId, split_type || 'equal'], 
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        res.status(201).json({ 
          id: this.lastID, 
          group_id: groupId,
          monto, 
          categoria, 
          descripcion, 
          fecha,
          paid_by: userId,
          split_type: split_type || 'equal'
        });
      });
    });
};

// Obtener gastos de un grupo
export const getGroupExpenses = (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Verificar que el usuario sea miembro del grupo
  db.get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', 
    [groupId, userId], (err, membership) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!membership) {
        return res.status(403).json({ error: 'No tienes acceso a este grupo' });
      }

      const query = `
        SELECT ge.*, u.email as paid_by_email
        FROM group_expenses ge
        JOIN users u ON ge.paid_by = u.id
        WHERE ge.group_id = ?
        ORDER BY ge.fecha DESC, ge.created_at DESC
      `;

      db.all(query, [groupId], (err, expenses) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(expenses);
      });
    });
};

// Eliminar gasto de grupo
export const deleteGroupExpense = (req, res) => {
  const { groupId, expenseId } = req.params;
  const userId = req.user.id;

  // Verificar que el usuario sea miembro del grupo y haya pagado el gasto
  db.get(`
    SELECT ge.* FROM group_expenses ge
    JOIN group_members gm ON ge.group_id = gm.group_id
    WHERE ge.id = ? AND ge.group_id = ? AND gm.user_id = ? AND ge.paid_by = ?
  `, [expenseId, groupId, userId, userId], (err, expense) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!expense) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este gasto' });
    }

    db.run('DELETE FROM group_expenses WHERE id = ?', [expenseId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
}; 