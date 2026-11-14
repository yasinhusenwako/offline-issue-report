import { Router, Request, Response } from 'express';
import reportRoutes from './report.routes';
import syncRoutes from './sync.routes';
import authRoutes from './auth.routes';
import { supabase } from '../config/supabase';

const router = Router();

// ─── Health check ─────────────────────────────────────────────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'unknown';
  try {
    const { error } = await supabase.from('reports').select('id').limit(1);
    dbStatus = error ? 'degraded' : 'ok';
  } catch {
    dbStatus = 'unreachable';
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbStatus,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/sync', syncRoutes);

export default router;

