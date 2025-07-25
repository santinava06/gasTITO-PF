import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de variables de entorno
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(router);

// Servir archivos estáticos del frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Para cualquier ruta que no sea API, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// Rutas base de ejemplo
app.get('/', (req, res) => {
  res.send('API Finanzas Familiares');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
}); 