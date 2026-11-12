// ─── Custom Error Classes ─────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 503, 'DATABASE_ERROR', details);
  }
}

export class DuplicateError extends AppError {
  public readonly existingId?: string;

  constructor(message: string, existingId?: string) {
    super(
      message,
      409,
      'DUPLICATE',
      existingId ? { existing_report_id: existingId } : undefined
    );
    this.existingId = existingId;
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string, allowed: string[]) {
    super(
      `Cannot transition from '${from}' to '${to}'`,
      422,
      'INVALID_TRANSITION',
      { from, to, allowed }
    );
  }
}

