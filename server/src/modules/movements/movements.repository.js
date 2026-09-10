import { randomUUID } from 'node:crypto';
import { db } from '../../db/connection.js';

function rowToMovement(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    type: row.type,
    delta: row.delta,
    reason: row.reason,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    username: row.username ?? null,
    serviceId: row.service_id ?? null,
    createdAt: row.created_at,
  };
}

const MOVEMENT_FROM = `
  FROM movements m
  JOIN products p ON p.id = m.product_id
  LEFT JOIN users u ON u.id = m.user_id
`;

const MOVEMENT_SELECT = `SELECT m.*, p.name AS product_name, p.sku AS product_sku, u.username AS username ${MOVEMENT_FROM}`;

export const movementsRepository = {
  list({ search, type, productId, serviceId, offset, limit }) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (type) {
      conditions.push('m.type = ?');
      params.push(type);
    }
    if (productId) {
      conditions.push('m.product_id = ?');
      params.push(productId);
    }
    if (serviceId) {
      conditions.push('m.service_id = ?');
      params.push(serviceId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) AS total ${MOVEMENT_FROM} ${where}`).get(...params);
    const rows = db
      .prepare(`${MOVEMENT_SELECT} ${where} ORDER BY m.created_at DESC, m.rowid DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      items: rows.map(rowToMovement),
      total: countRow.total,
      limit,
      offset,
    };
  },

  findById(id) {
    const row = db.prepare(`${MOVEMENT_SELECT} WHERE m.id = ?`).get(id);
    return rowToMovement(row);
  },

  // Updates products.quantity and inserts the movement in one transaction so the
  // audit trail can never drift from the actual stock count.
  createForAdjustment({ productId, type, delta, reason, userId, serviceId }) {
    db.exec('BEGIN');
    try {
      const before = db.prepare('SELECT quantity FROM products WHERE id = ?').get(productId);
      if (!before) {
        db.exec('ROLLBACK');
        return null;
      }

      const after = db
        .prepare("UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ? RETURNING quantity")
        .get(delta, productId);

      const id = randomUUID();
      db.prepare(
        `INSERT INTO movements (id, product_id, type, delta, reason, quantity_before, quantity_after, user_id, service_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, productId, type, delta, reason ?? '', before.quantity, after.quantity, userId ?? null, serviceId ?? null);

      db.exec('COMMIT');
      return this.findById(id);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  },
};
