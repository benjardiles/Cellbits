import { ValidationError } from './errors.js';

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function validate(schema, source = 'body') {
  return function validator(req, _res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ValidationError(details));
    }
    req[source] = result.data;
    return next();
  };
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status && Number.isInteger(error.status) ? error.status : 500;
  const body = {
    status: 'error',
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'Error interno del servidor.',
  };
  if (error.details) body.details = error.details;
  if (status >= 500) console.error(error);
  res.status(status).json(body);
}