import nodemailer from 'nodemailer';
import { config, emailConfigured } from '../../config/index.js';

let transporter = null;

function getTransporter() {
  if (!emailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

export async function sendNotificationEmail({ to, subject, text }) {
  const client = getTransporter();
  if (!client) throw new Error('SMTP no configurado (ver server/.env.example).');
  return client.sendMail({ from: config.smtp.from, to, subject, text });
}
