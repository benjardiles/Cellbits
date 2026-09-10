import jwt from 'jsonwebtoken';
import { asyncHandler } from './http.js';
import { UnauthorizedError } from './errors.js';
import { config } from '../config/index.js';

export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Token de autenticación requerido.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new UnauthorizedError('Token inválido o expirado.');
  }

  req.user = { id: decoded.sub, username: decoded.username };
  return next();
});