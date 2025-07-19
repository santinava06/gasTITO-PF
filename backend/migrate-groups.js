import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('finanzas.db');

console.log('Iniciando migración de grupos...');

db.serialize(() => {
  // Crear tabla de grupos de gastos
  db.run(`CREATE TABLE IF NOT EXISTS expense_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla expense_groups:', err);
    } else {
      console.log('Tabla expense_groups creada/verificada exitosamente');
    }
  });

  // Crear tabla de miembros de grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(group_id, user_id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla group_members:', err);
    } else {
      console.log('Tabla group_members creada/verificada exitosamente');
    }
  });

  // Crear tabla de invitaciones a grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    invited_by INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    token TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla group_invitations:', err);
    } else {
      console.log('Tabla group_invitations creada/verificada exitosamente');
    }
  });

  // Crear tabla de gastos de grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    paid_by INTEGER NOT NULL,
    split_type TEXT DEFAULT 'equal',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla group_expenses:', err);
    } else {
      console.log('Tabla group_expenses creada/verificada exitosamente');
    }
  });
});

// Cerrar la conexión después de un tiempo
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Migración de grupos completada. Base de datos cerrada.');
    }
  });
}, 2000); 