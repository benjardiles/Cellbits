import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { inventoryRoutes } from '../modules/inventory/inventory.routes.js';
import { movementsRoutes } from '../modules/movements/movements.routes.js';
import { servicesRoutes } from '../modules/services/services.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/movements', movementsRoutes);
router.use('/services', servicesRoutes);

export { router as routes };