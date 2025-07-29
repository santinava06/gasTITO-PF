import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { authRateLimit } from '../middlewares/security.js';
import { 
  enableTwoFactor, 
  verifyAndActivateTwoFactor, 
  verifyLoginTwoFactor 
} from '../utils/twoFactorAuth.js';
import { logUserAction, logSecurityEvent } from '../utils/auditLogger.js';
import db from '../models/user.js';

const router = Router();

// Rate limiting específico para 2FA
router.use(authRateLimit);

// Habilitar 2FA
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const { userId, email } = req.user;
    
    // Verificar si ya tiene 2FA habilitado
    db.get('SELECT two_factor_secret FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        logSecurityEvent('2FA_ENABLE_DB_ERROR', {
          userId,
          error: err.message
        });
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (user.two_factor_secret) {
        return res.status(400).json({ 
          error: '2FA ya está habilitado para este usuario' 
        });
      }

      // Generar datos de 2FA
      const twoFactorData = await enableTwoFactor(userId, email);
      
      // Guardar secreto temporalmente (se activará cuando se verifique)
      db.run('UPDATE users SET two_factor_temp_secret = ?, two_factor_backup_tokens = ? WHERE id = ?', 
        [twoFactorData.secret, JSON.stringify(twoFactorData.backupTokens), userId], 
        function(err) {
          if (err) {
            logSecurityEvent('2FA_ENABLE_SAVE_ERROR', {
              userId,
              error: err.message
            });
            return res.status(500).json({ error: 'Error al guardar configuración 2FA' });
          }

          logUserAction('2FA_ENABLE_INITIATED', userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.json({
            qrCode: twoFactorData.qrCode,
            backupTokens: twoFactorData.backupTokens,
            message: 'Escanea el código QR con tu aplicación de autenticación'
          });
        }
      );
    });
  } catch (error) {
    logSecurityEvent('2FA_ENABLE_ERROR', {
      userId: req.user?.id,
      error: error.message
    });
    res.status(500).json({ error: 'Error al habilitar 2FA' });
  }
});

// Verificar y activar 2FA
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const { userId } = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    // Obtener datos temporales de 2FA
    db.get('SELECT two_factor_temp_secret, two_factor_backup_tokens FROM users WHERE id = ?', 
      [userId], async (err, user) => {
        if (err) {
          logSecurityEvent('2FA_VERIFY_DB_ERROR', {
            userId,
            error: err.message
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!user.two_factor_temp_secret) {
          return res.status(400).json({ 
            error: 'No hay configuración 2FA pendiente' 
          });
        }

        const backupTokens = JSON.parse(user.two_factor_backup_tokens || '[]');
        const result = verifyAndActivateTwoFactor(user.two_factor_temp_secret, token, backupTokens);

        if (result.success) {
          // Activar 2FA permanentemente
          db.run('UPDATE users SET two_factor_secret = ?, two_factor_backup_tokens = ?, two_factor_temp_secret = NULL, two_factor_enabled = 1 WHERE id = ?', 
            [user.two_factor_temp_secret, JSON.stringify(result.remainingTokens || backupTokens), userId], 
            function(err) {
              if (err) {
                logSecurityEvent('2FA_ACTIVATE_SAVE_ERROR', {
                  userId,
                  error: err.message
                });
                return res.status(500).json({ error: 'Error al activar 2FA' });
              }

              logUserAction('2FA_ACTIVATED', userId, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                method: result.method
              });

              res.json({
                success: true,
                message: '2FA activado exitosamente',
                remainingBackupTokens: result.remainingTokens?.length || backupTokens.length
              });
            }
          );
        } else {
          logSecurityEvent('2FA_VERIFY_FAILED', {
            userId,
            tokenProvided: token
          });
          res.status(400).json({ error: result.error });
        }
      }
    );
  } catch (error) {
    logSecurityEvent('2FA_VERIFY_ERROR', {
      userId: req.user?.id,
      error: error.message
    });
    res.status(500).json({ error: 'Error al verificar 2FA' });
  }
});

// Deshabilitar 2FA
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida para deshabilitar 2FA' });
    }

    // Verificar contraseña
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      const bcrypt = await import('bcryptjs');
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        logSecurityEvent('2FA_DISABLE_INVALID_PASSWORD', {
          userId,
          ip: req.ip
        });
        return res.status(400).json({ error: 'Contraseña incorrecta' });
      }

      // Deshabilitar 2FA
      db.run('UPDATE users SET two_factor_secret = NULL, two_factor_backup_tokens = NULL, two_factor_temp_secret = NULL, two_factor_enabled = 0 WHERE id = ?', 
        [userId], function(err) {
          if (err) {
            logSecurityEvent('2FA_DISABLE_SAVE_ERROR', {
              userId,
              error: err.message
            });
            return res.status(500).json({ error: 'Error al deshabilitar 2FA' });
          }

          logUserAction('2FA_DISABLED', userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.json({
            success: true,
            message: '2FA deshabilitado exitosamente'
          });
        }
      );
    });
  } catch (error) {
    logSecurityEvent('2FA_DISABLE_ERROR', {
      userId: req.user?.id,
      error: error.message
    });
    res.status(500).json({ error: 'Error al deshabilitar 2FA' });
  }
});

// Verificar 2FA durante login
router.post('/login-verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'Usuario y token requeridos' });
    }

    // Obtener datos de 2FA del usuario
    db.get('SELECT two_factor_secret, two_factor_backup_tokens, two_factor_enabled FROM users WHERE id = ?', 
      [userId], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!user || !user.two_factor_enabled) {
          return res.status(400).json({ error: 'Usuario no encontrado o 2FA no habilitado' });
        }

        const backupTokens = JSON.parse(user.two_factor_backup_tokens || '[]');
        const result = verifyLoginTwoFactor(user.two_factor_secret, token, backupTokens);

        if (result.success) {
          // Actualizar tokens de respaldo si se usó uno
          if (result.method === 'backup') {
            db.run('UPDATE users SET two_factor_backup_tokens = ? WHERE id = ?', 
              [JSON.stringify(result.remainingTokens), userId]);
          }

          logUserAction('2FA_LOGIN_VERIFIED', userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: result.method
          });

          res.json({
            success: true,
            message: '2FA verificado exitosamente'
          });
        } else {
          logSecurityEvent('2FA_LOGIN_VERIFY_FAILED', {
            userId,
            tokenProvided: token
          });
          res.status(400).json({ error: result.error });
        }
      }
    );
  } catch (error) {
    logSecurityEvent('2FA_LOGIN_VERIFY_ERROR', {
      error: error.message
    });
    res.status(500).json({ error: 'Error al verificar 2FA' });
  }
});

// Obtener estado de 2FA
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    db.get('SELECT two_factor_enabled, two_factor_backup_tokens FROM users WHERE id = ?', 
      [userId], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const backupTokens = JSON.parse(user.two_factor_backup_tokens || '[]');

        res.json({
          enabled: user.two_factor_enabled === 1,
          remainingBackupTokens: backupTokens.length
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de 2FA' });
  }
});

export default router;