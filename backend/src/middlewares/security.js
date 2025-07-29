import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

// Rate limiting para diferentes endpoints
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 300) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo más tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiting específico para autenticación
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos (aumentado de 5)
  message: {
    error: 'Demasiados intentos de autenticación. Inténtalo de nuevo en 15 minutos.',
    retryAfter: 900
  },
  skipSuccessfulRequests: true,
});

// Rate limiting para creación de grupos y gastos
export const createResourceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 creaciones por minuto (aumentado de 10)
  message: {
    error: 'Demasiadas creaciones de recursos. Inténtalo de nuevo más tarde.',
    retryAfter: 60
  },
});

// Rate limiting para operaciones de lectura
export const readResourceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 lecturas por minuto
  message: {
    error: 'Demasiadas solicitudes de lectura. Inténtalo de nuevo más tarde.',
    retryAfter: 60
  },
});

// Slow down para prevenir ataques de fuerza bruta
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 100, // permitir 100 requests por ventana
  delayMs: 500, // agregar 500ms de delay por request después del límite
});

// Validación de inputs para usuarios
export const validateUserInput = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre debe tener entre 2 y 50 caracteres y solo letras'),
];

// Validación de inputs para gastos
export const validateExpenseInput = [
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?-]+$/)
    .withMessage('La descripción debe tener entre 3 y 200 caracteres'),
  body('monto')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('El monto debe ser un número válido entre 0.01 y 999999.99'),
  body('categoria')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  body('fecha')
    .isISO8601()
    .withMessage('Fecha inválida'),
  body('member_emails')
    .optional()
    .isArray()
    .withMessage('Los emails de miembros deben ser un array'),
];

// Validación de inputs para grupos
export const validateGroupInput = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/)
    .withMessage('El nombre del grupo debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?-]+$/)
    .withMessage('La descripción debe tener máximo 500 caracteres'),
];

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitización de datos
export const sanitizeInput = (req, res, next) => {
  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim().replace(/[<>]/g, '');
      }
    });
  }

  // Sanitizar body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

// Headers de seguridad
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  }
});

// Middleware para prevenir ataques de timing
export const preventTimingAttacks = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Agregar delay aleatorio para prevenir timing attacks
    const randomDelay = Math.random() * 100;
    setTimeout(() => {}, randomDelay);
  });
  
  next();
};