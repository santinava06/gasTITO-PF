import jwt from 'jsonwebtoken';
import { logSecurityEvent } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    logSecurityEvent('AUTH_TOKEN_MISSING', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(401).json({ 
      error: 'Token de autenticación requerido',
      code: 'TOKEN_MISSING'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      let eventType = 'AUTH_TOKEN_INVALID';
      let errorMessage = 'Token inválido';
      let statusCode = 403;
      
      if (err.name === 'TokenExpiredError') {
        eventType = 'AUTH_TOKEN_EXPIRED';
        errorMessage = 'Token expirado. Por favor, inicia sesión nuevamente.';
        statusCode = 401;
      } else if (err.name === 'JsonWebTokenError') {
        eventType = 'AUTH_TOKEN_MALFORMED';
        errorMessage = 'Token malformado';
      }
      
      logSecurityEvent(eventType, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        error: err.message,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      
      return res.status(statusCode).json({ 
        error: errorMessage,
        code: eventType
      });
    }
    
    // Verificar que el token tenga los campos requeridos
    if (!user.id || !user.email) {
      logSecurityEvent('AUTH_TOKEN_INCOMPLETE', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        tokenPayload: JSON.stringify(user)
      });
      
      return res.status(403).json({ 
        error: 'Token incompleto',
        code: 'TOKEN_INCOMPLETE'
      });
    }
    
    // Agregar información adicional al usuario
    req.user = {
      ...user,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  });
}

// Middleware para verificar roles específicos
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Verificar si el usuario tiene el rol requerido
    const userRole = req.user.role || 'member';
    if (!roles.includes(userRole)) {
      logSecurityEvent('AUTH_INSUFFICIENT_PERMISSIONS', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: roles,
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
}

// Middleware para verificar propiedad de recursos
export function requireOwnership(resourceType) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Esta función debería ser implementada según el tipo de recurso
    // Por ejemplo, verificar si el usuario es dueño del grupo o gasto
    const resourceId = req.params.groupId || req.params.expenseId;
    
    if (!resourceId) {
      return res.status(400).json({ 
        error: 'ID de recurso requerido',
        code: 'RESOURCE_ID_MISSING'
      });
    }
    
    // Aquí se implementaría la lógica específica para cada tipo de recurso
    // Por ahora, permitimos el acceso y se maneja en los controladores
    next();
  };
} 