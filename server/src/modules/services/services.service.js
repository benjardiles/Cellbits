import { randomUUID } from 'node:crypto';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { movementsService } from '../movements/movements.service.js';
import { servicesRepository } from './services.repository.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';

const STATUS_LABELS = {
  recibido: 'Recibido',
  en_diagnostico: 'En diagnóstico',
  en_reparacion: 'En reparación',
  listo_para_entrega: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function buildStatusMessage(service, status) {
  const label = STATUS_LABELS[status] ?? status;
  const deviceLabel = service.device || 'tu equipo';
  return `Hola ${service.customerName}, el estado de "${deviceLabel}" cambió a: ${label}.`;
}

// Suma las cantidades cuando el mismo producto aparece en varias líneas, para
// que la validación de stock evalúe la demanda real y no cada línea por separado.
function mergeParts(parts) {
  const totals = new Map();
  for (const part of parts) {
    totals.set(part.productId, (totals.get(part.productId) ?? 0) + part.quantity);
  }
  return Array.from(totals, ([productId, quantity]) => ({ productId, quantity }));
}

async function validatePartsAvailability(parts) {
  for (const part of parts) {
    const product = inventoryRepository.findById(part.productId);
    if (!product) throw new NotFoundError('Producto (repuesto)');
    if (product.quantity < part.quantity) {
      throw new ValidationError([
        { field: 'parts', message: `Stock insuficiente de "${product.name}" para el repuesto solicitado.` },
      ]);
    }
  }
}

export const servicesService = {
  async list(query) {
    const parsedOffset = Number.parseInt(query.offset, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);
    const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50;

    return servicesRepository.list({
      search: query.search?.trim() || null,
      status: query.status || null,
      paymentStatus: query.paymentStatus || null,
      offset,
      limit,
    });
  },

  async getById(id) {
    const service = servicesRepository.findById(id);
    if (!service) throw new NotFoundError('Servicio');
    return service;
  },

  async getDetail(id) {
    const service = await this.getById(id);
    const partsResult = await movementsService.list({ serviceId: id, limit: 100 });
    const notifications = servicesRepository.listNotifications(id);
    return { service, parts: partsResult.items, notifications };
  },

  async create(payload, userId) {
    const parts = mergeParts(payload.parts ?? []);
    await validatePartsAvailability(parts);

    const id = randomUUID();
    const service = servicesRepository.create({ id, ...payload, userId });

    const appliedParts = [];
    try {
      for (const part of parts) {
        await movementsService.register(
          part.productId,
          { type: 'salida', delta: -part.quantity, reason: `Repuesto usado en servicio (${service.device || service.type})` },
          userId,
          service.id,
        );
        appliedParts.push(part);
      }
    } catch (error) {
      // La demanda ya se validó de antemano, así que esto solo puede pasar por
      // una condición de carrera real (stock cambiado por otra petición a mitad
      // de camino). Se compensa el stock ya descontado y se borra el servicio
      // a medio crear, para nunca dejar un registro fantasma.
      for (const part of appliedParts) {
        await movementsService.register(
          part.productId,
          { type: 'entrada', delta: part.quantity, reason: 'Reversión: fallo al registrar el servicio' },
          userId,
          service.id,
        );
      }
      servicesRepository.delete(service.id);
      throw error;
    }

    servicesRepository.insertNotification({
      id: randomUUID(),
      serviceId: service.id,
      status: service.status,
      message: buildStatusMessage(service, service.status),
    });

    return servicesRepository.findById(service.id);
  },

  async update(id, payload) {
    if (!servicesRepository.findById(id)) throw new NotFoundError('Servicio');
    return servicesRepository.update(id, payload);
  },

  async updateStatus(id, status, userId) {
    const service = await this.getById(id);
    if (service.status === status) {
      throw new ValidationError([{ field: 'status', message: 'El servicio ya está en ese estado.' }]);
    }

    const updated = servicesRepository.updateStatus(id, status);
    if (!updated) throw new NotFoundError('Servicio');

    servicesRepository.insertNotification({
      id: randomUUID(),
      serviceId: id,
      status,
      message: buildStatusMessage(updated, status),
    });

    return updated;
  },

  async remove(id) {
    if (!servicesRepository.delete(id)) throw new NotFoundError('Servicio');
    return { deleted: true };
  },

  async getDashboard() {
    const totals = servicesRepository.getTotals();
    const recent = servicesRepository.getRecent(5);
    return { totals, recentServices: recent };
  },
};
