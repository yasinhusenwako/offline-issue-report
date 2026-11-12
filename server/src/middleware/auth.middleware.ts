import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/database';
import { DevUser } from '../types/api';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// ─── ⚠️  DEVELOPMENT-ONLY ROLE SIMULATION ────────────────────────────────────
// This middleware simulates authentication for development purposes only.
// In production, replace with a real JWT/OAuth authentication provider.
// Never rely on client-controlled headers for security in production.

const DEV_USERS: Record<string, DevUser> = {
  'dev-field-worker': {
    id: 'dev-field-worker-id',
    role: 'field_worker',
    name: 'Dev Field Worker',
  },
  'dev-coordinator': {
    id: 'dev-coordinator-id',
    role: 'coordinator',
    name: 'Dev Coordinator',
  },
};

/**
 * Attaches a simulated user to req.user based on the X-Dev-Role header.
 * Falls back to field_worker if the header is missing.
 */
export function devAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const roleHeader = req.headers['x-dev-role'] as string | undefined;

  if (roleHeader === 'coordinator') {
    req.user = DEV_USERS['dev-coordinator'];
  } else {
    // Default: field_worker
    req.user = DEV_USERS['dev-field-worker'];
  }

  next();
}

/**
 * Requires the request to have an attached user (dev auth must run first).
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
}

/**
 * Requires the user to have one of the specified roles.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not permitted. Required: ${roles.join(' or ')}`
      );
    }
    next();
  };
}

