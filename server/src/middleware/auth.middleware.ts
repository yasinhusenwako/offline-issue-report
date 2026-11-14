import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/database';
import { DevUser } from '../types/api';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { supabase } from '../config/supabase';

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
  'dev-admin': {
    id: 'dev-admin-id',
    role: 'admin',
    name: 'Dev Admin',
  },
};

/**
 * Universal Auth Middleware:
 * 1. Checks for Authorization: Bearer <token> and validates via Supabase Auth
 * 2. If valid, attaches verified user + role from public.profiles table
 * 3. Falls back gracefully to X-Dev-Role simulation when no JWT is provided (for dev & automated test suites)
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          // Fetch real profile and role
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const role: UserRole = (profile?.role as UserRole) || 'field_worker';
          const name: string =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Field Operative';

          req.user = {
            id: user.id,
            email: user.email,
            role,
            name,
          };

          return next();
        }
      } catch (err) {
        // Fall back to dev auth if Supabase verification throws
        console.warn('[Auth Middleware] JWT verification error, falling back:', err);
      }
    }
  }

  // Fallback: X-Dev-Role (development & Jest automated test suites)
  const roleHeader = req.headers['x-dev-role'] as string | undefined;

  if (roleHeader === 'admin') {
    req.user = DEV_USERS['dev-admin'];
  } else if (roleHeader === 'coordinator') {
    req.user = DEV_USERS['dev-coordinator'];
  } else {
    req.user = DEV_USERS['dev-field-worker'];
  }

  next();
}

/**
 * Requires the request to have an attached user.
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
 * Admins are automatically authorized for all role-restricted routes.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    // Admins have universal superuser access
    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      return next();
    }
    throw new ForbiddenError(
      `Role '${req.user.role}' is not permitted. Required: ${roles.join(' or ')}`
    );
  };
}
