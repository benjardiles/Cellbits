import { randomUUID } from 'node:crypto';
import { config } from '../../config/index.js';
import { inventoryRepository } from './inventory.repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../../core/errors.js';

function normalizeSpecs(specs) {
  if (specs === undefined) return undefined;
  if (!Array.isArray(specs)) {
    throw new ValidationError([{ field: 'specs', message: 'Debe ser una lista de especificaciones.' }]);
  }
  return specs
    .filter((spec) => spec && String(spec.key ?? '').trim() !== '')
    .map((spec) => ({
      key: String(spec.key).trim(),
      value: String(spec.value ?? '').trim(),
    }));
}

function ensureValidQuantity(quantity) {
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
    throw new ValidationError([{ field: 'quantity', message: 'Debe ser un entero mayor o igual a 0.' }]);
  }
}

export const inventoryService = {
  async list(query) {
    const parsedOffset = Number.parseInt(query.offset, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);
    const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50;
    return inventoryRepository.list({
      search: query.search?.trim() || null,
      categoryId: query.categoryId || null,
      lowStock: query.lowStock === 'true' || query.lowStock === true,
      offset,
      limit,
    });
  },

  async getById(id) {
    const product = inventoryRepository.findById(id);
    if (!product) throw new NotFoundError('Producto');
    return product;
  },

  async publicInfo(id) {
    const product = inventoryRepository.findById(id);
    if (!product) throw new NotFoundError('Producto');
    return product;
  },

  async create(payload) {
    const specs = normalizeSpecs(payload.specs);
    ensureValidQuantity(payload.quantity);

    if (inventoryRepository.findBySku(payload.sku)) {
      throw new ConflictError(`Ya existe un producto con el SKU "${payload.sku}".`);
    }

    const id = randomUUID();
    return inventoryRepository.create({ ...payload, id, specs });
  },

  async update(id, payload) {
    if (!inventoryRepository.findById(id)) throw new NotFoundError('Producto');

    if (payload.sku !== undefined) {
      const bySku = inventoryRepository.findBySku(payload.sku);
      if (bySku && bySku.id !== id) {
        throw new ConflictError(`Ya existe un producto con el SKU "${payload.sku}".`);
      }
    }

    const specs = normalizeSpecs(payload.specs);

    return inventoryRepository.update(id, { ...payload, specs });
  },

  async remove(id) {
    if (!inventoryRepository.delete(id)) throw new NotFoundError('Producto');
    return { deleted: true };
  },

  async listCategories() {
    return inventoryRepository.listCategories();
  },

  async createCategory(name) {
    const normalized = String(name).trim();
    if (!normalized) {
      throw new ValidationError([{ field: 'name', message: 'El nombre de la categoría es obligatorio.' }]);
    }
    if (inventoryRepository.findCategoryByName(normalized)) {
      throw new ConflictError(`La categoría "${normalized}" ya existe.`);
    }
    return inventoryRepository.createCategory(normalized);
  },

  productScanUrl(id) {
    const safeDomain = String(config.appDomain).replace(/\/+$/, '');
    return `${safeDomain}/scan/${id}`;
  },

  buildQrPayload(id) {
    return { type: 'CELLBITS_PRODUCT', version: 1, url: inventoryService.productScanUrl(id), id };
  },

  async getDashboard() {
    const totals = inventoryRepository.getTotals();
    const lowStock = inventoryRepository.list({ lowStock: true, offset: 0, limit: 50 });
    const recent = inventoryRepository.getRecent(5);
    return { totals, lowStockProducts: lowStock.items, recentProducts: recent };
  },
};