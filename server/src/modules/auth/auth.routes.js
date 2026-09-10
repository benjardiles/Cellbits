import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../core/http.js';
import { authenticate } from '../../core/auth.middleware.js';
import { authController } from './auth.controller.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

export { router as authRoutes };