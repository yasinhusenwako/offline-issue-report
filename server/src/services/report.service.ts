import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { Report, ReportActivity, ReportStatus, ReportPriority, UserRole } from '../types/database';
import { CreateReportInput, UpdateReportInput, ReportFiltersInput } from '../validators/report.validators';
import {
  NotFoundError,
  ConflictError,
  DuplicateError,
  DatabaseError,
  ForbiddenError,
  InvalidTransitionError,
} from '../utils/errors';
import { buildPaginationMeta } from '../utils/response';
import {
  isValidTransition,
  getAllowedTransitions,
  requiresRejectionReason,
  isReopeningResolved,
  describeTransition,
} from '../utils/status-machine';
import { PaginationMeta } from '../types/api';

// ─── Report Service ───────────────────────────────────────────────────────────

export async function createReport(
  input: CreateReportInput,
  performedBy: string,
  _performedByRole: UserRole
): Promise<Report> {
  // 1. Idempotency check: prevent duplicate client_report_id
  const { data: existing, error: lookupError } = await supabase
    .from('reports')
    .select('id, client_report_id')
    .eq('client_report_id', input.client_report_id)
    .maybeSingle();

  if (lookupError) {
    throw new DatabaseError('Failed to check existing report', lookupError.message);
  }

  if (existing) {
    throw new DuplicateError(
      `Report with client_report_id '${input.client_report_id}' already exists`,
      existing.id
    );
  }

  const reportId = uuidv4();
  const now = new Date().toISOString();

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      client_report_id: input.client_report_id,
      category: input.category,
      description: input.description,
      location: input.location,
      priority: (input.priority as ReportPriority) ?? 'Medium',
      status: (input.status as ReportStatus) ?? 'Draft',
      reported_at: input.reported_at ?? now,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
      version: 1,
    })
    .select()
    .single();

  if (error || !report) {
    throw new DatabaseError('Failed to create report', error?.message);
  }

  // 2. Record creation activity
  await recordActivity({
    report_id: reportId,
    action_type: 'CREATED',
    performed_by: performedBy,
    new_value: { status: report.status, category: report.category, priority: report.priority },
    description: 'Report created',
  });

  return report;
}

export async function getReports(
  filters: ReportFiltersInput
): Promise<{ reports: Report[]; meta: PaginationMeta }> {
  const {
    page = 1,
    limit = 20,
    category,
    priority,
    status,
    dateFrom,
    dateTo,
    search,
    assignedTo,
  } = filters;

  let query = supabase.from('reports').select('*', { count: 'exact' });

  if (category) query = query.eq('category', category);
  if (priority) query = query.eq('priority', priority);
  if (status) query = query.eq('status', status);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);
  if (search) {
    query = query.or(
      `category.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new DatabaseError('Failed to fetch reports', error.message);
  }

  const meta = buildPaginationMeta(page, limit, count ?? 0);
  return { reports: data ?? [], meta };
}

export async function getReportById(id: string): Promise<Report & { activity: ReportActivity[] }> {
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new DatabaseError('Failed to fetch report', error.message);
  if (!report) throw new NotFoundError('Report');

  const { data: activity, error: actError } = await supabase
    .from('report_activity')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: true });

  if (actError) throw new DatabaseError('Failed to fetch activity', actError.message);

  return { ...report, activity: activity ?? [] };
}

export async function updateReport(
  id: string,
  input: UpdateReportInput,
  performedBy: string,
  _performedByRole: UserRole
): Promise<Report> {
  // 1. Fetch current report
  const { data: current, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new DatabaseError('Failed to fetch report', fetchError.message);
  if (!current) throw new NotFoundError('Report');

  // 2. Only Draft and Submitted reports can be edited
  if (!['Draft', 'Submitted'].includes(current.status)) {
    throw new ForbiddenError(
      `Reports with status '${current.status}' cannot be edited. Only Draft or Submitted reports are editable.`
    );
  }

  // 3. Optimistic concurrency check
  if (input.version !== current.version) {
    throw new ConflictError(
      `Version conflict: expected version ${current.version}, got ${input.version}. Fetch the latest report and retry.`,
      { serverVersion: current.version, clientVersion: input.version }
    );
  }

  const { version: _v, ...updateFields } = input;

  const { data: updated, error: updateError } = await supabase
    .from('reports')
    .update({
      ...updateFields,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new DatabaseError('Failed to update report', updateError?.message);
  }

  await recordActivity({
    report_id: id,
    action_type: 'UPDATED',
    performed_by: performedBy,
    previous_value: {
      category: current.category,
      description: current.description,
      location: current.location,
      priority: current.priority,
    },
    new_value: {
      category: updated.category,
      description: updated.description,
      location: updated.location,
      priority: updated.priority,
    },
    description: 'Report fields updated',
  });

  return updated;
}

export async function deleteReport(
  id: string,
  _performedBy: string,
  _performedByRole: UserRole
): Promise<void> {
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new DatabaseError('Failed to fetch report', fetchError.message);
  if (!report) throw new NotFoundError('Report');

  if (report.status !== 'Draft') {
    throw new ForbiddenError(
      `Only Draft reports can be deleted. This report has status '${report.status}'.`
    );
  }

  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw new DatabaseError('Failed to delete report', error.message);
}

export async function transitionStatus(
  id: string,
  input: {
    status: ReportStatus;
    rejection_reason?: string;
    notes?: string;
    reopen?: boolean;
    version: number;
  },
  performedBy: string,
  performedByRole: UserRole
): Promise<Report> {
  const { data: current, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new DatabaseError('Failed to fetch report', fetchError.message);
  if (!current) throw new NotFoundError('Report');

  // Validate transition
  if (!isValidTransition(current.status as ReportStatus, input.status)) {
    throw new InvalidTransitionError(
      current.status,
      input.status,
      getAllowedTransitions(current.status as ReportStatus)
    );
  }

  // Explicit reopen required for Resolved -> In Progress
  if (isReopeningResolved(current.status as ReportStatus, input.status) && !input.reopen) {
    throw new ForbiddenError(
      'Reopening a Resolved report requires an explicit reopen flag (reopen: true).'
    );
  }

  // Coordinator required for coordinator-only transitions
  if (
    ['Assigned', 'In Progress', 'Resolved', 'Rejected'].includes(input.status) &&
    performedByRole !== 'coordinator'
  ) {
    throw new ForbiddenError('Only coordinators can perform this status transition');
  }

  // Rejection must have a reason
  if (requiresRejectionReason(input.status) && !input.rejection_reason) {
    throw new ForbiddenError('A rejection reason is required when rejecting a report');
  }

  // Optimistic concurrency
  if (input.version !== current.version) {
    throw new ConflictError(
      `Version conflict: expected ${current.version}, got ${input.version}`,
      { serverVersion: current.version, clientVersion: input.version }
    );
  }

  const updatePayload: Partial<Omit<Report, 'id' | 'created_at'>> & {
    version: number;
    updated_at: string;
  } = {
    status: input.status,
    version: current.version + 1,
    updated_at: new Date().toISOString(),
  };

  if (input.status === 'Rejected') {
    updatePayload.rejection_reason = input.rejection_reason ?? null;
  }
  if (input.status === 'Resolved') {
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('reports')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new DatabaseError('Failed to update report status', updateError?.message);
  }

  await recordActivity({
    report_id: id,
    action_type: 'STATUS_CHANGED',
    performed_by: performedBy,
    previous_value: { status: current.status },
    new_value: {
      status: input.status,
      ...(input.rejection_reason ? { rejection_reason: input.rejection_reason } : {}),
    },
    description: input.notes ?? describeTransition(current.status as ReportStatus, input.status),
  });

  return updated;
}

export async function assignReport(
  id: string,
  input: { assigned_to: string; notes?: string; version: number },
  performedBy: string,
  performedByRole: UserRole
): Promise<Report> {
  if (performedByRole !== 'coordinator') {
    throw new ForbiddenError('Only coordinators can assign reports');
  }

  const { data: current, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new DatabaseError('Failed to fetch report', fetchError.message);
  if (!current) throw new NotFoundError('Report');

  if (!['Submitted', 'Assigned'].includes(current.status)) {
    throw new ForbiddenError(
      `Only Submitted or already-Assigned reports can be assigned. Current status: '${current.status}'`
    );
  }

  if (input.version !== current.version) {
    throw new ConflictError(
      `Version conflict: expected ${current.version}, got ${input.version}`,
      { serverVersion: current.version, clientVersion: input.version }
    );
  }

  const { data: updated, error } = await supabase
    .from('reports')
    .update({
      assigned_to: input.assigned_to,
      status: 'Assigned' as ReportStatus,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) throw new DatabaseError('Failed to assign report', error?.message);

  await recordActivity({
    report_id: id,
    action_type: 'ASSIGNED',
    performed_by: performedBy,
    previous_value: { assigned_to: current.assigned_to, status: current.status },
    new_value: { assigned_to: input.assigned_to, status: 'Assigned' },
    description: input.notes ?? `Assigned to ${input.assigned_to}`,
  });

  return updated;
}

export async function getReportActivity(reportId: string): Promise<ReportActivity[]> {
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError) throw new DatabaseError('Failed to verify report', reportError.message);
  if (!report) throw new NotFoundError('Report');

  const { data, error } = await supabase
    .from('report_activity')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw new DatabaseError('Failed to fetch activity', error.message);
  return data ?? [];
}

// ─── Internal helper ──────────────────────────────────────────────────────────

export async function recordActivity(params: {
  report_id: string;
  action_type: string;
  performed_by: string | null;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  description: string;
}): Promise<void> {
  const { error } = await supabase.from('report_activity').insert({
    id: uuidv4(),
    report_id: params.report_id,
    action_type: params.action_type,
    performed_by: params.performed_by,
    previous_value: params.previous_value ?? null,
    new_value: params.new_value ?? null,
    description: params.description,
  });

  if (error) {
    console.error('[Activity Record Error]', error.message);
  }
}
