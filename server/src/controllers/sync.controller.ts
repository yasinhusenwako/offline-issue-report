import { Request, Response, NextFunction } from 'express';
import * as SyncService from '../services/sync.service';
import { successResponse } from '../utils/response';
import { SyncBatchInput } from '../validators/report.validators';

// ─── Sync Controller ──────────────────────────────────────────────────────────

export async function syncReports(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as SyncBatchInput;
    const user = req.user!;
    const result = await SyncService.syncReportsBatch(input, user.id, user.role);

    // Return 207 Multi-Status when there are mixed results
    const statusCode =
      result.failed > 0 && result.created > 0 ? 207 :
      result.failed > 0 && result.created === 0 ? 422 :
      200;

    res.status(statusCode).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

