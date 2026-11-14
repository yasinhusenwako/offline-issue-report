import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { successResponse } from '../utils/response';
import { UserRole } from '../types/database';
import { ValidationError, NotFoundError } from '../utils/errors';

const router = Router();

/**
 * GET /api/auth/me
 * Returns current authenticated user and profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/users
 * Administrator only: list all registered user profiles
 */
router.get('/users', requireAuth, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(successResponse({ users: profiles || [] }));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/auth/users/:id/role
 * Administrator only: update a user's role
 */
router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['field_worker', 'coordinator', 'admin'].includes(role)) {
      throw new ValidationError('Invalid role specified');
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: role as UserRole, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) throw new NotFoundError('User profile');

    res.json(successResponse({ profile: updated }));
  } catch (err) {
    next(err);
  }
});

export default router;
