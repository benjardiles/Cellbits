import { createApp } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './db/migrations.js';
import { startNotificationsWorker } from './modules/notifications/notifications.worker.js';

runMigrations();

const app = createApp();

app.listen(config.port, () => {
  console.log(`API Cellbits escuchando en http://localhost:${config.port} (${config.env})`);
  startNotificationsWorker();
});