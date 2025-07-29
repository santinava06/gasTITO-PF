import db from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logUserAction, logSecurityEvent } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validación adicional
    if (!email || !password) {
      logSecurityEvent('REGISTER_VALIDATION_FAILED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'Campos faltantes'
      });
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Usar email como nombre si no se proporciona
    const userName = name || email.split('@')[0];

    // Verificar si el usuario ya existe
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        logSecurityEvent('DATABASE_ERROR', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          error: err.message
        });
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (user) {
        logSecurityEvent('REGISTER_DUPLICATE_EMAIL', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: email
        });
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Hash de la contraseña con salt más fuerte
      const saltRounds = 12;
      const hash = await bcrypt.hash(password, saltRounds);

      // Insertar usuario
      db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', 
        [email, hash, userName], function (err) {
        if (err) {
          logSecurityEvent('DATABASE_ERROR', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error: err.message
          });
          return res.status(500).json({ error: 'Error al crear usuario' });
        }

        // Generar token JWT
        const token = jwt.sign(
          { 
            id: this.lastID, 
            email,
            name: userName,
            iat: Date.now()
          }, 
          JWT_SECRET, 
          { 
            expiresIn: '7d',
            issuer: 'finanzas-api',
            audience: 'finanzas-app'
          }
        );

        // Log de registro exitoso
        logUserAction('USER_REGISTERED', this.lastID, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: email,
          name: userName
        });

        res.status(201).json({ 
          token, 
          user: { 
            id: this.lastID, 
            email,
            name: userName
          } 
        });
      });
    });
  } catch (error) {
    logSecurityEvent('REGISTER_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validación
    if (!email || !password) {
      logSecurityEvent('LOGIN_VALIDATION_FAILED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'Campos faltantes'
      });
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        logSecurityEvent('DATABASE_ERROR', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          error: err.message
        });
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (!user) {
        logSecurityEvent('LOGIN_USER_NOT_FOUND', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: email
        });
        return res.status(400).json({ 
          error: 'Usuario o contraseña incorrectos' 
        });
      }

      // Verificar contraseña
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        logSecurityEvent('LOGIN_INVALID_PASSWORD', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: email
        });
        return res.status(400).json({ 
          error: 'Usuario o contraseña incorrectos' 
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          name: user.name,
          iat: Date.now()
        }, 
        JWT_SECRET, 
        { 
          expiresIn: '7d',
          issuer: 'finanzas-api',
          audience: 'finanzas-app'
        }
      );

      // Log de login exitoso
      logUserAction('USER_LOGIN', user.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: user.email
      });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email,
          name: user.name
        } 
      });
    });
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para verificar token (usada en middleware de auth)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logSecurityEvent('TOKEN_VERIFICATION_FAILED', {
      error: error.message,
      token: token.substring(0, 20) + '...' // Solo los primeros 20 caracteres
    });
    return null;
  }
}; 