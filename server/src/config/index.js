import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  appDomain: process.env.APPDOMAIN || 'http://localhost:5173',
  // Orígenes permitidos por CORS: APPDOMAIN + los que se agreguen en CORS_ORIGINS (separados por coma).
  corsOrigins: [process.env.APPDOMAIN || 'http://localhost:5173', ...(process.env.CORS_ORIGINS || '').split(',')]
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
};

// El correo es una función opcional: si no hay host/usuario/clave configurados,
// las notificaciones se quedan en 'pending' (§4.4 de DOCUMENTACION.md) en vez
// de que el servidor falle al arrancar.
export const emailConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from);

// Auditoría #6: avisar fuerte si producción sigue con los valores de ejemplo.
const DEFAULT_JWT_SECRET = 'cellbits_dev_secret_change_me';
export const insecureDefaults = [
  config.jwt.secret === DEFAULT_JWT_SECRET && 'JWT_SECRET usa el valor de ejemplo',
].filter(Boolean);
