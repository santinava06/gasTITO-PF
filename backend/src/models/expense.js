import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('finanzas.db');

db.serialize(() => {
  // Tabla de gastos individuales con user_id del creador
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Tabla de grupos de gastos
  db.run(`CREATE TABLE IF NOT EXISTS expense_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Tabla de miembros de grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(group_id, user_id)
  )`);

  // Tabla de invitaciones a grupos
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
  )`);

  // Tabla de gastos de grupos
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
  )`);

  // Tabla de relación para gastos compartidos individuales 
  db.run(`CREATE TABLE IF NOT EXISTS expense_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(expense_id, user_id)
  )`);
});

export default db; 