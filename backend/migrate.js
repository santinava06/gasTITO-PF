import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('finanzas.db');

console.log('Iniciando migración de la base de datos...');

db.serialize(() => {
  // Verificar si la tabla expenses tiene el campo user_id
  db.get("PRAGMA table_info(expenses)", (err, rows) => {
    if (err) {
      console.error('Error al verificar estructura de la tabla:', err);
      return;
    }
    
    db.all("PRAGMA table_info(expenses)", (err, columns) => {
      if (err) {
        console.error('Error al obtener columnas:', err);
        return;
      }
      
      const hasUserId = columns.some(col => col.name === 'user_id');
      
      if (!hasUserId) {
        console.log('Agregando campo user_id a la tabla expenses...');
        
        // Agregar el campo user_id
        db.run('ALTER TABLE expenses ADD COLUMN user_id INTEGER', (err) => {
          if (err) {
            console.error('Error al agregar user_id:', err);
            return;
          }
          
          console.log('Campo user_id agregado exitosamente');
          
          // Si hay gastos existentes, asignarlos al primer usuario disponible
          db.get('SELECT id FROM users LIMIT 1', (err, user) => {
            if (err) {
              console.error('Error al obtener usuario:', err);
              return;
            }
            
            if (user) {
              console.log(`Asignando gastos existentes al usuario con ID: ${user.id}`);
              db.run('UPDATE expenses SET user_id = ? WHERE user_id IS NULL', [user.id], (err) => {
                if (err) {
                  console.error('Error al actualizar gastos:', err);
                } else {
                  console.log('Gastos existentes actualizados exitosamente');
                }
              });
            } else {
              console.log('No hay usuarios en la base de datos. Los gastos existentes no tendrán user_id asignado.');
            }
          });
        });
      } else {
        console.log('El campo user_id ya existe en la tabla expenses');
      }
    });
  });
  
  // Crear tabla de miembros si no existe
  db.run(`CREATE TABLE IF NOT EXISTS expense_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(expense_id, user_id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla expense_members:', err);
    } else {
      console.log('Tabla expense_members creada/verificada exitosamente');
    }
  });
});

// Cerrar la conexión después de un tiempo
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Migración completada. Base de datos cerrada.');
    }
  });
}, 2000); 