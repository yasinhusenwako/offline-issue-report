import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  idParamSchema,
  createReportSchema,
  updateReportSchema,
  statusTransitionSchema,
  assignReportSchema,
  reportFiltersSchema,
} from '../validators/report.validators';

const router = Router();

// All report routes require authentication
router.use(requireAuth);

// ─── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/reports
 * Create a new report (field workers and coordinators)
 */
router.post(
  '/',
  validate(createReportSchema, 'body'),
  ReportController.createReport
);

/**
 * GET /api/reports
 * List reports with filtering, search, and pagination
 */
router.get(
  '/',
  validate(reportFiltersSchema, 'query'),
  ReportController.getReports
);

/**
 * GET /api/reports/:id
 * Get a single report with its activity history
 */
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  ReportController.getReportById
);

/**
 * PATCH /api/reports/:id
 * Update editable fields (draft/submitted reports only)
 */
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateReportSchema, 'body'),
  ReportController.updateReport
);

/**
 * DELETE /api/reports/:id
 * Delete a draft report only
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  ReportController.deleteReport
);

// ─── Status Management ────────────────────────────────────────────────────────

/**
 * PATCH /api/reports/:id/status
 * Transition report status (enforces state machine on backend)
 */
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(statusTransitionSchema, 'body'),
  ReportController.transitionStatus
);

// ─── Assignment ───────────────────────────────────────────────────────────────

/**
 * PATCH /api/reports/:id/assign
 * Assign report to a worker (coordinators only)
 */
router.patch(
  '/:id/assign',
  requireRole('coordinator'),
  validate(idParamSchema, 'params'),
  validate(assignReportSchema, 'body'),
  ReportController.assignReport
);

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * GET /api/reports/:id/activity
 * Get chronological activity history for a report
 */
router.get(
  '/:id/activity',
  validate(idParamSchema, 'params'),
  ReportController.getReportActivity
);

export default router;

