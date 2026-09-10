import { emailConfigured } from '../../config/index.js';
import { notificationsRepository } from './notifications.repository.js';
import { sendNotificationEmail } from './notifications.mailer.js';

const POLL_INTERVAL_MS = 60_000;

async function processPending() {
  const pending = notificationsRepository.listPendingWithEmail();
  for (const row of pending) {
    try {
      await sendNotificationEmail({
        to: row.customer_email,
        subject: 'CellBits · Actualización de tu servicio',
        text: row.message,
      });
      notificationsRepository.markSent(row.id);
    } catch (error) {
      // Se deja en 'pending': el próximo ciclo reintenta. No se marca como
      // fallida para no perder el registro ni bloquear el resto del lote.
      console.error(`[notifications] No se pudo enviar el correo de la notificación ${row.id}:`, error.message);
    }
  }
}

export function startNotificationsWorker() {
  if (!emailConfigured) {
    console.log('[notifications] SMTP no configurado — las notificaciones de servicio quedan en "pending" (ver server/.env.example).');
    return;
  }

  processPending();
  setInterval(processPending, POLL_INTERVAL_MS);
}
