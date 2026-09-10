import { existsSync, rmSync } from 'node:fs';
import { dbPath } from './connection.js';
import { db } from './connection.js';

db.close();

for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (existsSync(file)) {
    rmSync(file);
    console.log(`Eliminado ${file}`);
  }
}

console.log('Base de datos reseteada. Ejecuta "npm run db:seed -w server" para recrear el admin.');