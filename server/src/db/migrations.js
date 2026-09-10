import { db } from './connection.js';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `,
  `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'unidad',
    location TEXT NOT NULL DEFAULT '',
    category_id INTEGER,
    specs TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    delta INTEGER NOT NULL CHECK (delta != 0),
    reason TEXT NOT NULL DEFAULT '',
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
    user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_movements_created ON movements(created_at);
  `,
  `
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('reparacion', 'instalacion', 'cambio_partes', 'diagnostico', 'otro')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    customer_email TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'en_diagnostico', 'en_reparacion', 'listo_para_entrega', 'entregado', 'cancelado')),
    payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'pagado')),
    price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
    paid_at TEXT,
    user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_services_created ON services(created_at);
  `,
  `
  ALTER TABLE movements ADD COLUMN service_id TEXT REFERENCES services(id) ON DELETE SET NULL;
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_movements_service ON movements(service_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS service_notifications (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'pending' CHECK (channel IN ('pending', 'email', 'whatsapp')),
    sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_service_notifications_service ON service_notifications(service_id);
  `,
];

export function runMigrations() {
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);');
  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((row) => row.name),
  );

  let appliedCount = 0;
  const apply = db.prepare('INSERT INTO _migrations (name) VALUES (?)');
  for (const [index, sql] of migrations.entries()) {
    const name = `migration_${index}`;
    if (applied.has(name)) continue;
    db.exec('BEGIN');
    try {
      db.exec(sql);
      apply.run(name);
      db.exec('COMMIT');
      appliedCount += 1;
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Error aplicando migración ${name}: ${error.message}`);
    }
  }

  return appliedCount;
}