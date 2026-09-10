import { db } from '../../db/connection.js';

export const notificationsRepository = {
  // Solo trae notificaciones pendientes de un servicio con correo de cliente
  // registrado; sin correo se quedan en 'pending' para un canal futuro (WhatsApp).
  listPendingWithEmail() {
    return db
      .prepare(
        `SELECT n.id, n.message, s.customer_name AS customer_name, s.customer_email AS customer_email
         FROM service_notifications n
         JOIN services s ON s.id = n.service_id
         WHERE n.channel = 'pending' AND n.sent_at IS NULL AND s.customer_email != ''
         ORDER BY n.created_at ASC`,
      )
      .all();
  },

  markSent(id) {
    db.prepare("UPDATE service_notifications SET channel = 'email', sent_at = datetime('now') WHERE id = ?").run(id);
  },
};
