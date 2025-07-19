import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/index.js';

// Configuración de variables de entorno
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(router);

// Rutas base de ejemplo
app.get('/', (req, res) => {
  res.send('API Finanzas Familiares');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
}); 