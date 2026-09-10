import { db } from '../../db/connection.js';

function rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    device: row.device,
    description: row.description,
    status: row.status,
    paymentStatus: row.payment_status,
    price: row.price,
    paidAt: row.paid_at,
    username: row.username ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    serviceId: row.service_id,
    status: row.status,
    message: row.message,
    channel: row.channel,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

const SERVICE_FROM = `
  FROM services s
  LEFT JOIN users u ON u.id = s.user_id
`;

const SERVICE_SELECT = `SELECT s.*, u.username AS username ${SERVICE_FROM}`;

export const servicesRepository = {
  list({ search, status, paymentStatus, offset, limit }) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(s.customer_name LIKE ? OR s.device LIKE ? OR s.customer_phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (paymentStatus) {
      conditions.push('s.payment_status = ?');
      params.push(paymentStatus);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) AS total ${SERVICE_FROM} ${where}`).get(...params);
    const rows = db
      .prepare(`${SERVICE_SELECT} ${where} ORDER BY s.created_at DESC, s.rowid DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      items: rows.map(rowToService),
      total: countRow.total,
      limit,
      offset,
    };
  },

  findById(id) {
    const row = db.prepare(`${SERVICE_SELECT} WHERE s.id = ?`).get(id);
    return rowToService(row);
  },

  create({ id, type, customerName, customerPhone, customerEmail, device, description, paymentStatus, price, userId }) {
    db.prepare(
      `INSERT INTO services (id, type, customer_name, customer_phone, customer_email, device, description, payment_status, price, paid_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'pagado' THEN datetime('now') ELSE NULL END, ?)`,
    ).run(
      id,
      type,
      customerName,
      customerPhone ?? '',
      customerEmail ?? '',
      device ?? '',
      description ?? '',
      paymentStatus ?? 'pendiente',
      price ?? 0,
      paymentStatus ?? 'pendiente',
      userId ?? null,
    );
    return this.findById(id);
  },

  update(id, { type, customerName, customerPhone, customerEmail, device, description, price, paymentStatus }) {
    const patch = [];
    const params = [];

    for (const [column, value] of Object.entries({
      type,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      device,
      description,
      price,
      payment_status: paymentStatus,
    })) {
      if (value !== undefined) {
        patch.push(`${column} = ?`);
        params.push(value);
      }
    }

    if (paymentStatus !== undefined) {
      patch.push("paid_at = CASE WHEN ? = 'pagado' THEN COALESCE(paid_at, datetime('now')) ELSE NULL END");
      params.push(paymentStatus);
    }

    if (patch.length === 0) return this.findById(id);

    patch.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE services SET ${patch.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  updateStatus(id, status) {
    const result = db
      .prepare("UPDATE services SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id);
    if (result.changes === 0) return null;
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM services WHERE id = ?').run(id).changes > 0;
  },

  getTotals() {
    const byStatusRows = db.prepare('SELECT status, COUNT(*) AS count FROM services GROUP BY status').all();
    const byStatus = Object.fromEntries(byStatusRows.map((row) => [row.status, row.count]));
    const pending = db
      .prepare("SELECT COUNT(*) AS count, COALESCE(SUM(price), 0) AS total FROM services WHERE payment_status = 'pendiente'")
      .get();
    const paidToday = db
      .prepare("SELECT COALESCE(SUM(price), 0) AS total FROM services WHERE paid_at IS NOT NULL AND date(paid_at) = date('now')")
      .get();
    const paidMonth = db
      .prepare("SELECT COALESCE(SUM(price), 0) AS total FROM services WHERE paid_at IS NOT NULL AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')")
      .get();

    return {
      totalServices: byStatusRows.reduce((sum, row) => sum + row.count, 0),
      byStatus,
      pendingPaymentCount: pending.count,
      pendingPaymentTotal: pending.total,
      paidTodayTotal: paidToday.total,
      paidMonthTotal: paidMonth.total,
    };
  },

  getRecent(limit) {
    const rows = db.prepare(`${SERVICE_SELECT} ORDER BY s.created_at DESC LIMIT ?`).all(limit);
    return rows.map(rowToService);
  },

  // Notification log: rows created here are queued, never actually sent (no
  // email/WhatsApp provider wired up yet). This keeps the schema and history
  // ready so a real sender can later pick up channel = 'pending' rows.
  insertNotification({ id, serviceId, status, message }) {
    db.prepare(
      `INSERT INTO service_notifications (id, service_id, status, message)
       VALUES (?, ?, ?, ?)`,
    ).run(id, serviceId, status, message);
    return this.findNotificationById(id);
  },

  findNotificationById(id) {
    const row = db.prepare('SELECT * FROM service_notifications WHERE id = ?').get(id);
    return rowToNotification(row);
  },

  listNotifications(serviceId) {
    const rows = db
      .prepare('SELECT * FROM service_notifications WHERE service_id = ? ORDER BY created_at DESC')
      .all(serviceId);
    return rows.map(rowToNotification);
  },
};
