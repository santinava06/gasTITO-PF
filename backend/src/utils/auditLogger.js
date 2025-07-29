import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Winston para logs
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'finanzas-api' },
  transports: [
    // Logs de auditoría
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Logs de errores
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    // Logs de seguridad
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/security.log'),
      level: 'warn'
    })
  ],
});

// Agregar console transport en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Función para registrar eventos de auditoría
export const auditLog = (action, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    userId: details.userId || 'anonymous',
    resource: details.resource || 'unknown',
    method: details.method || 'unknown',
    status: details.status || 'unknown',
    duration: details.duration || 0,
  };

  logger.info('AUDIT_EVENT', logEntry);
  return logEntry;
};

// Función para registrar eventos de seguridad
export const securityLog = (event, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    userId: details.userId || 'anonymous',
    severity: details.severity || 'medium',
  };

  logger.warn('SECURITY_EVENT', logEntry);
  return logEntry;
};

// Función para registrar errores
export const errorLog = (error, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    ip: context.ip || 'unknown',
    userId: context.userId || 'anonymous',
  };

  logger.error('ERROR_EVENT', logEntry);
  return logEntry;
};

// Middleware para logging automático
export const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  // Interceptar la respuesta para registrar el status
  res.send = function(data) {
    const duration = Date.now() - start;
    
    auditLog('HTTP_REQUEST', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      resource: req.originalUrl.split('/')[1] || 'unknown',
    });

    originalSend.call(this, data);
  };

  next();
};

// Funciones específicas para diferentes tipos de eventos
export const logUserAction = (action, userId, details) => {
  return auditLog(action, {
    userId,
    resource: 'user',
    ...details
  });
};

export const logExpenseAction = (action, userId, expenseId, details) => {
  return auditLog(action, {
    userId,
    resource: 'expense',
    resourceId: expenseId,
    ...details
  });
};

export const logGroupAction = (action, userId, groupId, details) => {
  return auditLog(action, {
    userId,
    resource: 'group',
    resourceId: groupId,
    ...details
  });
};

export const logSecurityEvent = (event, details) => {
  return securityLog(event, {
    severity: 'high',
    ...details
  });
};

// Función para obtener logs de auditoría
export const getAuditLogs = async (filters = {}) => {
  // Esta función podría implementarse para leer los logs
  // y filtrarlos según los parámetros proporcionados
  return {
    message: 'Función de lectura de logs implementada',
    filters
  };
};

export default logger;