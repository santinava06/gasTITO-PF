import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { authRateLimit } from '../middlewares/security.js';
import { validateUserInput, handleValidationErrors } from '../middlewares/security.js';

const router = Router();

// Rate limiting específico para autenticación
router.use(authRateLimit);

// Ruta de prueba
router.get('/', (req, res) => {
  res.json({ message: 'API de autenticación funcionando' });
});

// Rutas con validación de inputs
router.post('/register', validateUserInput, handleValidationErrors, register);
router.post('/login', [
  // Validación más simple para login (solo email y password)
  validateUserInput[0], // email validation
  validateUserInput[1], // password validation
  handleValidationErrors
], login);

export default router; 