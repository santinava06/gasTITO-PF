import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor de prueba escuchando en puerto ${PORT}`);
});