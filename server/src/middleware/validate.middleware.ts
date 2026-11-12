import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Returns Express middleware that validates req[target] against a Zod schema.
 * On success, the parsed (coerced + stripped) value is written back to req[target].
 * On failure, throws a ValidationError that errorHandler catches.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }
    // Overwrite with parsed (coerced & stripped) values
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

