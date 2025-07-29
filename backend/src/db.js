import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'finanzas',
  password: process.env.PGPASSWORD || 'tu_password',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
});

export default pool;