import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { logSecurityEvent } from './auditLogger.js';

// Configuración para TOTP
const TOTP_CONFIG = {
  issuer: 'Finanzas Familiares',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 2 // Permitir tokens válidos en ventana de ±2 períodos
};

// Generar secreto para 2FA
export const generateTwoFactorSecret = (userId, email) => {
  try {
    const secret = speakeasy.generateSecret({
      name: email,
      issuer: TOTP_CONFIG.issuer,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: null // Se generará cuando se solicite
    };
  } catch (error) {
    logSecurityEvent('2FA_SECRET_GENERATION_ERROR', {
      userId,
      error: error.message
    });
    throw new Error('Error al generar secreto 2FA');
  }
};

// Generar código QR para 2FA
export const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    logSecurityEvent('2FA_QR_GENERATION_ERROR', {
      error: error.message
    });
    throw new Error('Error al generar código QR');
  }
};

// Verificar token 2FA
export const verifyTwoFactorToken = (secret, token) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: TOTP_CONFIG.window,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period
    });

    return verified;
  } catch (error) {
    logSecurityEvent('2FA_TOKEN_VERIFICATION_ERROR', {
      error: error.message
    });
    return false;
  }
};

// Generar token de respaldo para 2FA
export const generateBackupTokens = () => {
  try {
    const backupTokens = [];
    for (let i = 0; i < 10; i++) {
      backupTokens.push(speakeasy.generateSecret({ length: 10 }).base32);
    }
    return backupTokens;
  } catch (error) {
    logSecurityEvent('2FA_BACKUP_TOKENS_GENERATION_ERROR', {
      error: error.message
    });
    throw new Error('Error al generar tokens de respaldo');
  }
};

// Verificar token de respaldo
export const verifyBackupToken = (storedTokens, token) => {
  try {
    const index = storedTokens.indexOf(token);
    if (index !== -1) {
      // Remover el token usado
      storedTokens.splice(index, 1);
      return true;
    }
    return false;
  } catch (error) {
    logSecurityEvent('2FA_BACKUP_TOKEN_VERIFICATION_ERROR', {
      error: error.message
    });
    return false;
  }
};

// Función para habilitar 2FA para un usuario
export const enableTwoFactor = async (userId, email) => {
  try {
    const twoFactorData = generateTwoFactorSecret(userId, email);
    const qrCode = await generateQRCode(twoFactorData.otpauthUrl);
    const backupTokens = generateBackupTokens();

    return {
      secret: twoFactorData.secret,
      qrCode,
      backupTokens,
      otpauthUrl: twoFactorData.otpauthUrl
    };
  } catch (error) {
    logSecurityEvent('2FA_ENABLE_ERROR', {
      userId,
      error: error.message
    });
    throw error;
  }
};

// Función para verificar y activar 2FA
export const verifyAndActivateTwoFactor = (secret, token, backupTokens = []) => {
  try {
    // Primero intentar verificar con TOTP
    if (verifyTwoFactorToken(secret, token)) {
      logSecurityEvent('2FA_ACTIVATED_TOTP', {
        secretPrefix: secret.substring(0, 10) + '...'
      });
      return { success: true, method: 'totp' };
    }

    // Si falla TOTP, intentar con token de respaldo
    if (backupTokens.length > 0 && verifyBackupToken(backupTokens, token)) {
      logSecurityEvent('2FA_ACTIVATED_BACKUP', {
        remainingBackupTokens: backupTokens.length
      });
      return { success: true, method: 'backup', remainingTokens: backupTokens };
    }

    logSecurityEvent('2FA_ACTIVATION_FAILED', {
      secretPrefix: secret.substring(0, 10) + '...',
      tokenProvided: token
    });

    return { success: false, error: 'Token inválido' };
  } catch (error) {
    logSecurityEvent('2FA_ACTIVATION_ERROR', {
      error: error.message
    });
    throw error;
  }
};

// Función para verificar 2FA durante login
export const verifyLoginTwoFactor = (secret, token, backupTokens = []) => {
  try {
    // Verificar con TOTP
    if (verifyTwoFactorToken(secret, token)) {
      return { success: true, method: 'totp' };
    }

    // Verificar con token de respaldo
    if (backupTokens.length > 0 && verifyBackupToken(backupTokens, token)) {
      return { 
        success: true, 
        method: 'backup', 
        remainingTokens: backupTokens 
      };
    }

    return { success: false, error: 'Token 2FA inválido' };
  } catch (error) {
    logSecurityEvent('2FA_LOGIN_VERIFICATION_ERROR', {
      error: error.message
    });
    return { success: false, error: 'Error al verificar 2FA' };
  }
};