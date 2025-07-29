import db from './expense.js';

export const createRecurringExpense = (data, cb) => {
  const { created_by, monto, descripcion, categoria, frecuencia, proxima_fecha } = data;
  db.run(
    `INSERT INTO recurring_expenses (created_by, monto, descripcion, categoria, frecuencia, proxima_fecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [created_by, monto, descripcion, categoria, frecuencia, proxima_fecha],
    function (err) {
      if (err) return cb(err);
      db.get('SELECT * FROM recurring_expenses WHERE id = ?', [this.lastID], cb);
    }
  );
};

export const listAllRecurringExpenses = (userId, cb) => {
  db.all(
    `SELECT * FROM recurring_expenses WHERE created_by = ? ORDER BY proxima_fecha`,
    [userId],
    cb
  );
};

export const pauseRecurringExpense = (id, cb) => {
  db.run(
    'UPDATE recurring_expenses SET activo = 0 WHERE id = ?',
    [id],
    function (err) {
      if (err) return cb(err);
      db.get('SELECT * FROM recurring_expenses WHERE id = ?', [id], cb);
    }
  );
};

export const resumeRecurringExpense = (id, cb) => {
  db.run(
    'UPDATE recurring_expenses SET activo = 1 WHERE id = ?',
    [id],
    function (err) {
      if (err) return cb(err);
      db.get('SELECT * FROM recurring_expenses WHERE id = ?', [id], cb);
    }
  );
};

export const deleteRecurringExpense = (id, cb) => {
  db.run('DELETE FROM recurring_expenses WHERE id = ?', [id], cb);
};