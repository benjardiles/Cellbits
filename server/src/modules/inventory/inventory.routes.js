import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../core/http.js';
import { authenticate } from '../../core/auth.middleware.js';
import { inventoryController } from './inventory.controller.js';
import { registerMovementSchema } from '../movements/movements.routes.js';

const router = Router();

const specItemSchema = z.object({
  key: z.string().min(1, 'El nombre de la especificación es obligatorio.'),
  value: z.string().optional().default(''),
});

const productSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  sku: z.string().trim().min(1, 'El SKU es obligatorio.').max(64),
  description: z.string().trim().max(2000).optional().default(''),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa.'),
  minQuantity: z.number().int().min(0).optional().default(0),
  unit: z.string().trim().min(1, 'La unidad es obligatoria.').max(32),
  location: z.string().trim().max(120).optional().default(''),
  categoryId: z.number().int().positive().nullable().optional().default(null),
  specs: z.array(specItemSchema).optional().default([]),
});

// La cantidad no es editable aquí a propósito: todo cambio de stock debe pasar
// por PATCH /:id/quantity para quedar registrado en el historial de movimientos.
const productUpdateSchema = productSchema.omit({ quantity: true }).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No se enviaron campos para actualizar.' },
);

const productIdSchema = z.object({ id: z.string().uuid('ID de producto inválido.') });
const categorySchema = z.object({ name: z.string().trim().min(1, 'El nombre es obligatorio.') });

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  lowStock: z.string().optional(),
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get('/', authenticate, validate(listQuerySchema, 'query'), inventoryController.list);
router.get('/dashboard', authenticate, inventoryController.dashboard);
router.get('/categories', authenticate, inventoryController.listCategories);
router.post('/categories', authenticate, validate(categorySchema), inventoryController.createCategory);
router.post('/', authenticate, validate(productSchema), inventoryController.create);

router.get('/public/:id', validate(productIdSchema, 'params'), inventoryController.publicGet);
router.get('/:id/qr', authenticate, validate(productIdSchema, 'params'), inventoryController.qrPayload);

router.get('/:id', authenticate, validate(productIdSchema, 'params'), inventoryController.getById);
router.put('/:id', authenticate, validate(productIdSchema, 'params'), validate(productUpdateSchema), inventoryController.update);
router.patch('/:id/quantity', authenticate, validate(productIdSchema, 'params'), validate(registerMovementSchema), inventoryController.adjustQuantity);
router.delete('/:id', authenticate, validate(productIdSchema, 'params'), inventoryController.remove);

export { router as inventoryRoutes };