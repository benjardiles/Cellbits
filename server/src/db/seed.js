import bcrypt from 'bcryptjs';
import { db } from './connection.js';
import { runMigrations } from './migrations.js';
import { config } from '../config/index.js';

runMigrations();

const existing = db
  .prepare('SELECT id FROM users WHERE username = ?')
  .get(config.admin.username);

if (existing) {
  console.log(`El usuario "${config.admin.username}" ya existe, se omite el seed.`);
} else {
  const passwordHash = bcrypt.hashSync(config.admin.password, 12);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
    config.admin.username,
    passwordHash,
  );
  console.log(`Usuario admin "${config.admin.username}" creado.`);
}

db.close();