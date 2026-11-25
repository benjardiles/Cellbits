import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './core/http.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Detrás de Caddy + Cloudflare Tunnel: confiar en el proxy local para obtener la IP real del visitante
  app.set('trust proxy', 'loopback');
  app.use(helmet());
  // Auditoría #7: solo el propio frontend puede llamar a la API desde otro origen.
  app.use(cors({ origin: config.corsOrigins, credentials: false }));
  app.use(express.json({ limit: '1mb' }));

  if (config.env !== 'test') {
    app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { status: 'error', code: 'RATE_LIMITED', message: 'Demasiadas peticiones, inténtalo más tarde.' },
  });
  app.use('/api', limiter);

  // Auditoría #6: límite específico para el login contra fuerza bruta.
  // Solo cuentan los intentos fallidos, así un trabajador no se bloquea por entrar varias veces.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { status: 'error', code: 'RATE_LIMITED', message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.' },
  });
  app.use('/api/auth/login', loginLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', module: 'cellbits-api', time: new Date().toISOString() });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}