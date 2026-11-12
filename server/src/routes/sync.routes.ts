import { Router } from 'express';
import * as SyncController from '../controllers/sync.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { syncBatchSchema } from '../validators/report.validators';

const router = Router();

router.use(requireAuth);

/**
 * POST /api/sync/reports
 * Sync a batch of locally stored reports to the server.
 * Idempotent: safe to retry with the same batch.
 * Returns individual results per report.
 */
router.post(
  '/reports',
  validate(syncBatchSchema, 'body'),
  SyncController.syncReports
);

export default router;

