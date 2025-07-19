import sqlite3 from 'sqlite3';
import db from './expense.js'; // Reutilizamos la conexión

// Crear tabla de usuarios 
const userTableSql = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;
db.run(userTableSql);

export default db; 