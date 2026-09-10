import bcrypt from 'bcryptjs';
import { signToken } from '../../core/auth.middleware.js';
import { authRepository } from './auth.repository.js';
import { UnauthorizedError, NotFoundError } from '../../core/errors.js';

function toPublicUser(user) {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

export const authService = {
  async login({ username, password }) {
    const user = authRepository.findByUsername(username);
    if (!user) throw new UnauthorizedError();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError();

    const token = signToken({ sub: user.id, username: user.username });
    return { token, user: toPublicUser(user) };
  },

  async getCurrentUser(userId) {
    const user = authRepository.findPublicById(userId);
    if (!user) throw new NotFoundError('Usuario');
    return user;
  },
};