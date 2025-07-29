import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  securityHeaders, 
  sanitizeInput,
  createRateLimit
} from './middlewares/security.js';
import { auditMiddleware } from './utils/auditLogger.js';

// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middlewares de seguridad básicos
app.use(securityHeaders);
app.use(sanitizeInput);

// Rate limiting global
app.use(createRateLimit(15 * 60 * 1000, 1000)); // 1000 requests por 15 minutos

// CORS configurado de forma más segura
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // PATCH agregado
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de auditoría
app.use(auditMiddleware);

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas base de ejemplo
app.get('/', (req, res) => {
  res.send('API Finanzas Familiares');
});

// Rutas de la API
app.use('/api', router);

// Servir archivos estáticos del frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Para cualquier ruta que no sea API, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('Seguridad habilitada: Headers de seguridad, Sanitización, Rate limiting, Auditoría');
}); 