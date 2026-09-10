import { db } from '../../db/connection.js';

function productRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    quantity: row.quantity,
    minQuantity: row.min_quantity,
    unit: row.unit,
    location: row.location,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    specs: safeParseJson(row.specs),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeParseJson(value) {
  if (value === null || value === undefined || value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export const inventoryRepository = {
  list({ search, categoryId, lowStock, offset, limit }) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.location LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (lowStock) {
      conditions.push('p.quantity <= p.min_quantity');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS total FROM products p ${where}`)
      .get(...params);
    const total = countRow.total;

    const rows = db
      .prepare(
        `${PRODUCT_SELECT} ${where} ORDER BY p.name COLLATE NOCASE ASC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return {
      items: rows.map(productRowToProduct),
      total,
      limit,
      offset,
    };
  },

  findById(id) {
    const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id);
    return productRowToProduct(row);
  },

  findBySku(sku) {
    return db.prepare('SELECT id FROM products WHERE sku = ?').get(sku) ?? null;
  },

  create({ id, name, sku, description, quantity, minQuantity, unit, location, categoryId, specs }) {
    db.prepare(
      `INSERT INTO products (id, name, sku, description, quantity, min_quantity, unit, location, category_id, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      name,
      sku,
      description ?? '',
      quantity,
      minQuantity,
      unit,
      location ?? '',
      categoryId ?? null,
      JSON.stringify(specs ?? []),
    );
    return this.findById(id);
  },

  // No acepta `quantity`: el stock solo cambia vía movements.repository.createForAdjustment,
  // para que todo ajuste quede en la bitácora de movimientos.
  update(id, { name, sku, description, minQuantity, unit, location, categoryId, specs }) {
    const patch = [];
    const params = [];

    for (const [column, value] of Object.entries({
      name,
      sku,
      description,
      min_quantity: minQuantity,
      unit,
      location,
      category_id: categoryId,
    })) {
      if (value !== undefined) {
        patch.push(`${column} = ?`);
        params.push(value);
      }
    }
    if (specs !== undefined) {
      patch.push('specs = ?');
      params.push(JSON.stringify(specs));
    }
    if (patch.length === 0) return this.findById(id);

    patch.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE products SET ${patch.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
  },

  listCategories() {
    const rows = db
      .prepare('SELECT c.id, c.name, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name COLLATE NOCASE')
      .all();
    return rows;
  },

  findCategoryByName(name) {
    return db.prepare('SELECT id FROM categories WHERE name = ?').get(name) ?? null;
  },

  createCategory(name) {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    return db.prepare('SELECT id, name FROM categories WHERE id = ?').get(result.lastInsertRowid);
  },

  getTotals() {
    return db
      .prepare(
        `SELECT
           COUNT(*) AS totalProducts,
           COALESCE(SUM(quantity), 0) AS totalUnits,
           COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) AS lowStock
         FROM products`,
      )
      .get();
  },

  getRecent(limit) {
    const rows = db
      .prepare(`${PRODUCT_SELECT} ORDER BY p.created_at DESC LIMIT ?`)
      .all(limit);
    return rows.map(productRowToProduct);
  },
};