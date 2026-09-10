export class AppError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super(404, `${resource} no encontrado.`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Credenciales inválidas.') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(409, message, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(details) {
    super(400, 'Datos de entrada inválidos.', 'VALIDATION_ERROR', details);
  }
}