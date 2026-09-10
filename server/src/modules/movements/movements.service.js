import { inventoryRepository } from '../inventory/inventory.repository.js';
import { movementsRepository } from './movements.repository.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';

function ensureDeltaMatchesType(type, delta) {
  if (type === 'entrada' && delta <= 0) {
    throw new ValidationError([{ field: 'delta', message: 'Una entrada debe registrarse con una cantidad positiva.' }]);
  }
  if (type === 'salida' && delta >= 0) {
    throw new ValidationError([{ field: 'delta', message: 'Una salida debe registrarse con una cantidad negativa.' }]);
  }
}

export const movementsService = {
  async list(query) {
    const parsedOffset = Number.parseInt(query.offset, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);
    const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50;

    return movementsRepository.list({
      search: query.search?.trim() || null,
      type: query.type || null,
      productId: query.productId || null,
      serviceId: query.serviceId || null,
      offset,
      limit,
    });
  },

  async register(productId, { type, delta, reason }, userId, serviceId = null) {
    const product = inventoryRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    ensureDeltaMatchesType(type, delta);

    if (product.quantity + delta < 0) {
      throw new ValidationError([{ field: 'delta', message: 'No hay stock suficiente para esta salida.' }]);
    }

    const movement = movementsRepository.createForAdjustment({ productId, type, delta, reason, userId, serviceId });
    if (!movement) throw new NotFoundError('Producto');

    return { movement, product: inventoryRepository.findById(productId) };
  },
};
