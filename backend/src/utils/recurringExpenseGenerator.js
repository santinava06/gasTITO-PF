import db from '../models/expense.js';

function getNextDate(current, frecuencia) {
  const date = new Date(current);
  switch (frecuencia) {
    case 'mensual':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'semanal':
      date.setDate(date.getDate() + 7);
      break;
    case 'quincenal':
      date.setDate(date.getDate() + 15);
      break;
    case 'anual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error('Frecuencia no soportada');
  }
  return date.toISOString().slice(0, 10);
}

export function generateRealExpensesForUser(userId, cb) {
  const today = new Date().toISOString().slice(0, 10);
  db.all(
    `SELECT * FROM recurring_expenses WHERE created_by = ? AND activo = 1 AND proxima_fecha <= ?`,
    [userId, today],
    (err, recurrents) => {
      if (err) return cb(err);
      let pending = recurrents.length;
      if (pending === 0) return cb(null, 0);
      recurrents.forEach(rec => {
        db.run(
          `INSERT INTO expenses (monto, categoria, descripcion, fecha, user_id)
           VALUES (?, ?, ?, ?, ?)`,
          [rec.monto, rec.categoria, rec.descripcion, rec.proxima_fecha, rec.created_by],
          function (err) {
            if (err) return cb(err);
            const nextDate = getNextDate(rec.proxima_fecha, rec.frecuencia);
            db.run(
              `UPDATE recurring_expenses SET ultima_fecha = ?, proxima_fecha = ? WHERE id = ?`,
              [rec.proxima_fecha, nextDate, rec.id],
              function (err) {
                if (err) return cb(err);
                if (--pending === 0) cb(null, recurrents.length);
              }
            );
          }
        );
      });
    }
  );
}