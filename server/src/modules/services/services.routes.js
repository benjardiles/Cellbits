import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../core/http.js';
import { authenticate } from '../../core/auth.middleware.js';
import { servicesController } from './services.controller.js';

const router = Router();

export const SERVICE_TYPES = ['reparacion', 'instalacion', 'cambio_partes', 'diagnostico', 'otro'];
export const SERVICE_STATUSES = ['recibido', 'en_diagnostico', 'en_reparacion', 'listo_para_entrega', 'entregado', 'cancelado'];
export const PAYMENT_STATUSES = ['pendiente', 'pagado'];

const partSchema = z.object({
  productId: z.string().uuid('Repuesto inválido.'),
  quantity: z.number().int().positive('La cantidad del repuesto debe ser mayor a 0.'),
});

const serviceSchema = z.object({
  type: z.enum(SERVICE_TYPES, { errorMap: () => ({ message: 'Tipo de servicio inválido.' }) }),
  customerName: z.string().trim().min(1, 'El nombre del cliente es obligatorio.').max(160),
  customerPhone: z.string().trim().max(32).optional().default(''),
  customerEmail: z.string().trim().max(160).optional().default(''),
  device: z.string().trim().max(160).optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional().default('pendiente'),
  price: z.number().int('El precio debe ser un monto entero en CLP (sin decimales).').min(0, 'El precio no puede ser negativo.').optional().default(0),
  parts: z.array(partSchema).optional().default([]),
});

const serviceUpdateSchema = serviceSchema
  .omit({ parts: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No se enviaron campos para actualizar.' });

const serviceIdSchema = z.object({ id: z.string().uuid('ID de servicio inválido.') });
const statusSchema = z.object({ status: z.enum(SERVICE_STATUSES, { errorMap: () => ({ message: 'Estado inválido.' }) }) });

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get('/', authenticate, validate(listQuerySchema, 'query'), servicesController.list);
router.get('/dashboard', authenticate, servicesController.dashboard);
router.post('/', authenticate, validate(serviceSchema), servicesController.create);

router.get('/:id', authenticate, validate(serviceIdSchema, 'params'), servicesController.getById);
router.put('/:id', authenticate, validate(serviceIdSchema, 'params'), validate(serviceUpdateSchema), servicesController.update);
router.patch('/:id/status', authenticate, validate(serviceIdSchema, 'params'), validate(statusSchema), servicesController.updateStatus);
router.delete('/:id', authenticate, validate(serviceIdSchema, 'params'), servicesController.remove);

export { router as servicesRoutes };
