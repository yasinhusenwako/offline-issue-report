import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ─── Zod validation errors ───────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'Invalid request data', details)
    );
    return;
  }

  // ─── Operational errors (expected) ───────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
    return;
  }

  // ─── Unexpected errors ────────────────────────────────────────────────────
  console.error('[Unhandled Error]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const message = config.isProduction
    ? 'An unexpected error occurred'
    : err.message;

  const details = config.isProduction ? undefined : { stack: err.stack };

  res.status(500).json(
    errorResponse('INTERNAL_ERROR', message, details)
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Route ${req.method} ${req.path} not found`)
  );
}

