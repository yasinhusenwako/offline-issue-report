import { z } from 'zod';
import { ReportPriority, ReportStatus } from '../types/database';

// ─── Shared primitives ────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid('Must be a valid UUID');

export const idParamSchema = z.object({
  id: uuidSchema,
});

const STATUS_MAP: Record<string, ReportStatus> = {
  draft: 'Draft',
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  'in progress': 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const PRIORITY_MAP: Record<string, ReportPriority> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const reportStatusSchema = z.preprocess(
  (val) => (typeof val === 'string' ? STATUS_MAP[val.trim().toLowerCase()] ?? val : val),
  z.enum(['Draft', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected'], {
    errorMap: () => ({
      message: 'Invalid report status. Must be: Draft, Submitted, Assigned, In Progress, Resolved, or Rejected',
    }),
  })
);

const reportPrioritySchema = z.preprocess(
  (val) => (typeof val === 'string' ? PRIORITY_MAP[val.trim().toLowerCase()] ?? val : val),
  z.enum(['Low', 'Medium', 'High', 'Critical'], {
    errorMap: () => ({ message: 'Invalid priority. Must be: Low, Medium, High, or Critical' }),
  })
);

// ─── Create Report ────────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  client_report_id: uuidSchema,
  category: z
    .string({ required_error: 'Category is required' })
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must not exceed 100 characters')
    .trim(),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),
  location: z
    .string({ required_error: 'Location is required' })
    .min(2, 'Location must be at least 2 characters')
    .max(1000, 'Location must not exceed 1000 characters')
    .trim(),
  priority: reportPrioritySchema.optional().default('Medium'),
  status: reportStatusSchema.optional().default('Draft'),
  reported_at: z.string().datetime({ offset: true }).optional(),
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ─── Update Report ────────────────────────────────────────────────────────────

export const updateReportSchema = z.object({
  category: z.string().min(2).max(100).trim().optional(),
  description: z.string().min(10).max(5000).trim().optional(),
  location: z.string().min(2).max(1000).trim().optional(),
  priority: reportPrioritySchema.optional(),
  version: z.number().int().positive('Version must be a positive integer'),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// ─── Status Transition ────────────────────────────────────────────────────────

export const statusTransitionSchema = z.object({
  status: reportStatusSchema,
  rejection_reason: z.string().min(5).max(1000).optional(),
  notes: z.string().max(2000).optional(),
  reopen: z.boolean().optional(),
  version: z.number().int().positive('Version must be a positive integer'),
});

export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;

// ─── Assign Report ────────────────────────────────────────────────────────────

export const assignReportSchema = z.object({
  assigned_to: z.string().min(1, 'Assignee is required').max(255).trim(),
  notes: z.string().max(2000).optional(),
  version: z.number().int().positive('Version must be a positive integer'),
});

export type AssignReportInput = z.infer<typeof assignReportSchema>;

// ─── Report Filters ───────────────────────────────────────────────────────────

export const reportFiltersSchema = z.object({
  category: z.string().max(100).optional(),
  priority: reportPrioritySchema.optional(),
  status: reportStatusSchema.optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  assignedTo: z.string().max(255).optional(),
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;

// ─── Sync Report Item ─────────────────────────────────────────────────────────

export const syncReportItemSchema = z.object({
  client_report_id: uuidSchema,
  category: z.string().min(2).max(100).trim(),
  description: z.string().min(10).max(5000).trim(),
  location: z.string().min(2).max(1000).trim(),
  priority: reportPrioritySchema.optional().default('Medium'),
  status: reportStatusSchema.optional().default('Draft'),
  reported_at: z.string().datetime({ offset: true }).optional(),
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

export const syncBatchSchema = z.object({
  reports: z
    .array(syncReportItemSchema)
    .min(1, 'At least one report is required')
    .max(100, 'Maximum 100 reports per batch'),
  device_id: z.string().max(255).optional(),
});

export type SyncBatchInput = z.infer<typeof syncBatchSchema>;
