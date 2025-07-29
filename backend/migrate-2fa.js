import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'finanzas.db');
const db = new sqlite3.Database(dbPath);

console.log('Iniciando migración para 2FA...');

// Agregar columnas de 2FA a la tabla users
const addTwoFactorColumns = () => {
  return new Promise((resolve, reject) => {
    const queries = [
      'ALTER TABLE users ADD COLUMN two_factor_secret TEXT',
      'ALTER TABLE users ADD COLUMN two_factor_temp_secret TEXT',
      'ALTER TABLE users ADD COLUMN two_factor_backup_tokens TEXT',
      'ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0',
      'ALTER TABLE users ADD COLUMN name TEXT'
    ];

    let completed = 0;
    const total = queries.length;

    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          // Si la columna ya existe, ignorar el error
          if (err.message.includes('duplicate column name')) {
            console.log(`Columna ya existe en query ${index + 1}`);
          } else {
            console.error(`Error en query ${index + 1}:`, err.message);
          }
        } else {
          console.log(`Query ${index + 1} ejecutada exitosamente`);
        }

        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Crear tabla de logs de auditoría si no existe
const createAuditLogsTable = () => {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        action TEXT NOT NULL,
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        severity TEXT DEFAULT 'info'
      )
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('Error creando tabla audit_logs:', err.message);
        reject(err);
      } else {
        console.log('Tabla audit_logs creada/verificada exitosamente');
        resolve();
      }
    });
  });
};

// Crear índices para mejorar rendimiento
const createIndexes = () => {
  return new Promise((resolve, reject) => {
    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled)'
    ];

    let completed = 0;
    const total = queries.length;

    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Error creando índice ${index + 1}:`, err.message);
        } else {
          console.log(`Índice ${index + 1} creado/verificado exitosamente`);
        }

        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Ejecutar migración
const runMigration = async () => {
  try {
    console.log('Agregando columnas de 2FA...');
    await addTwoFactorColumns();

    console.log('Creando tabla de logs de auditoría...');
    await createAuditLogsTable();

    console.log('Creando índices...');
    await createIndexes();

    console.log('Migración completada exitosamente!');
    console.log('Campos agregados:');
    console.log('- two_factor_secret: Secreto para TOTP');
    console.log('- two_factor_temp_secret: Secreto temporal durante configuración');
    console.log('- two_factor_backup_tokens: Tokens de respaldo (JSON)');
    console.log('- two_factor_enabled: Estado de habilitación (0/1)');
    console.log('- name: Nombre del usuario');
    console.log('- Tabla audit_logs: Para logs de auditoría');

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando base de datos:', err.message);
      } else {
        console.log('Base de datos cerrada');
      }
    });
  }
};

runMigration();