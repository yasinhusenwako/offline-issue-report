import { Request, Response, NextFunction } from 'express';
import * as ReportService from '../services/report.service';
import { successResponse } from '../utils/response';
import { CreateReportInput, UpdateReportInput, ReportFiltersInput, StatusTransitionInput, AssignReportInput } from '../validators/report.validators';
import { UserRole, ReportStatus } from '../types/database';

// ─── Reports Controller ───────────────────────────────────────────────────────

export async function createReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateReportInput;
    const user = req.user!;
    const report = await ReportService.createReport(input, user.id, user.role);
    res.status(201).json(successResponse(report));
  } catch (err) {
    next(err);
  }
}

export async function getReports(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = req.query as unknown as ReportFiltersInput;
    const { reports, meta } = await ReportService.getReports(filters);
    res.json(successResponse(reports, meta));
  } catch (err) {
    next(err);
  }
}

export async function getReportById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const report = await ReportService.getReportById(id);
    res.json(successResponse(report));
  } catch (err) {
    next(err);
  }
}

export async function updateReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateReportInput;
    const user = req.user!;
    const report = await ReportService.updateReport(id, input, user.id, user.role);
    res.json(successResponse(report));
  } catch (err) {
    next(err);
  }
}

export async function deleteReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    await ReportService.deleteReport(id, user.id, user.role);
    res.json(successResponse({ id, deleted: true }));
  } catch (err) {
    next(err);
  }
}

export async function transitionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as StatusTransitionInput;
    const user = req.user!;
    const report = await ReportService.transitionStatus(
      id,
      {
        status: input.status as ReportStatus,
        rejection_reason: input.rejection_reason,
        notes: input.notes,
        reopen: input.reopen,
        version: input.version,
      },
      user.id,
      user.role
    );
    res.json(successResponse(report));
  } catch (err) {
    next(err);
  }
}

export async function assignReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as AssignReportInput;
    const user = req.user!;
    const report = await ReportService.assignReport(
      id,
      { assigned_to: input.assigned_to, notes: input.notes, version: input.version },
      user.id,
      user.role
    );
    res.json(successResponse(report));
  } catch (err) {
    next(err);
  }
}

export async function getReportActivity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const activity = await ReportService.getReportActivity(id);
    res.json(successResponse(activity));
  } catch (err) {
    next(err);
  }
}

