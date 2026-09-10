import { db } from '../../db/connection.js';

const PUBLIC_FIELDS = 'id, username, created_at';

export const authRepository = {
  findByUsername(username) {
    return db
      .prepare(`SELECT ${PUBLIC_FIELDS}, password_hash FROM users WHERE username = ?`)
      .get(username) ?? null;
  },

  findPublicById(id) {
    return db
      .prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`)
      .get(id) ?? null;
  },
};