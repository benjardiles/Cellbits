import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../core/http.js';
import { authenticate } from '../../core/auth.middleware.js';
import { movementsController } from './movements.controller.js';

const router = Router();

export const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste'];

export const registerMovementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES, { errorMap: () => ({ message: 'Tipo de movimiento inválido.' }) }),
  delta: z.number().int('La cantidad debe ser un entero.').refine((value) => value !== 0, 'La cantidad no puede ser cero.'),
  reason: z.string().trim().min(1, 'El motivo es obligatorio.').max(300),
});

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: z.enum(MOVEMENT_TYPES).optional(),
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get('/', authenticate, validate(listQuerySchema, 'query'), movementsController.list);

export { router as movementsRoutes };
