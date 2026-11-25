import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { config, insecureDefaults } from './config/index.js';
import { runMigrations } from './db/migrations.js';
import { authRepository } from './modules/auth/auth.repository.js';
import { logger } from './shared/logger.js';
import { startNotificationsWorker } from './modules/notifications/notifications.worker.js';

runMigrations();

// Auditoría #6: avisar si siguen activas credenciales de fábrica.
const warnings = [...insecureDefaults];
const defaultAdmin = authRepository.findByUsername('admin');
if (defaultAdmin && bcrypt.compareSync('admin123', defaultAdmin.password_hash)) {
  warnings.push('el usuario "admin" todavía tiene la contraseña "admin123"');
}
if (warnings.length) {
  const text = `⚠️  SEGURIDAD: ${warnings.join('; ')}. Cámbialo antes de exponer el sistema.`;
  if (config.env === 'production') logger.error(text);
  else logger.warn(text);
}

const app = createApp();

app.listen(config.port, () => {
  console.log(`API Cellbits escuchando en http://localhost:${config.port} (${config.env})`);
  startNotificationsWorker();
});
