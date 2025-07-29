import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import authRouter from './routes/auth.js';
import expensesRouter from './routes/expenses.js';
import groupsRouter from './routes/groups.js';
import twoFactorRouter from './routes/twoFactor.js';
import recurringExpensesRouter from './routes/recurringExpenses.js';

// Importar middlewares de seguridad
import { 
  securityHeaders, 
  sanitizeInput, 
  preventTimingAttacks,
  createRateLimit,
  speedLimiter
} from './middlewares/security.js';

// Importar logger de auditoría
import { auditMiddleware } from './utils/auditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS para producción
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://gas-tito-pf.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middlewares de seguridad
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(preventTimingAttacks);
app.use(createRateLimit());
app.use(speedLimiter);

// Middleware de auditoría
app.use(auditMiddleware);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de salud para verificar que el servidor esté funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas API
app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/2fa', twoFactorRouter);
app.use('/api/recurring-expenses', recurringExpensesRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Finanzas Familiares',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en esta API'
  });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('Seguridad habilitada: Headers de seguridad, Sanitización, Rate limiting, Auditoría');
});

export default app; 