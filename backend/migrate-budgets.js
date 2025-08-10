import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('finanzas.db');

console.log('Iniciando migración de presupuestos...');

db.serialize(() => {
  // Crear tabla de presupuestos
  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla budgets:', err);
    } else {
      console.log('Tabla budgets creada/verificada exitosamente');
    }
  });

  // Crear tabla de categorías de presupuesto
  db.run(`CREATE TABLE IF NOT EXISTS budget_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    spent REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES budgets (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla budget_categories:', err);
    } else {
      console.log('Tabla budget_categories creada/verificada exitosamente');
    }
  });

  // Crear tabla de presupuestos de grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla group_budgets:', err);
    } else {
      console.log('Tabla group_budgets creada/verificada exitosamente');
    }
  });

  // Crear tabla de categorías de presupuesto de grupos
  db.run(`CREATE TABLE IF NOT EXISTS group_budget_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    spent REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES group_budgets (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla group_budget_categories:', err);
    } else {
      console.log('Tabla group_budget_categories creada/verificada exitosamente');
    }
  });
});

// Cerrar la conexión después de un tiempo
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Migración de presupuestos completada. Base de datos cerrada.');
    }
  });
}, 2000); 