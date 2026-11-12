import { ReportStatus } from '../types/database';

// ─── Valid Status Transitions ─────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['Assigned', 'Rejected'],
  Assigned: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: ['In Progress'], // explicit reopen only
  Rejected: [], // no automatic transitions; deliberate admin action required
};

export function isValidTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: ReportStatus): ReportStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function requiresRejectionReason(toStatus: ReportStatus): boolean {
  return toStatus === 'Rejected';
}

export function isReopeningResolved(from: ReportStatus, to: ReportStatus): boolean {
  return from === 'Resolved' && to === 'In Progress';
}

export function isProtectedField(field: string): boolean {
  const PROTECTED = [
    'id',
    'client_report_id',
    'created_at',
    'version',
    'reported_at',
    'assigned_to',
    'resolved_at',
    'rejection_reason',
  ];
  return PROTECTED.includes(field);
}

export function describeTransition(from: ReportStatus, to: ReportStatus): string {
  if (to === 'Rejected') return `Report rejected (was: ${from})`;
  if (from === 'Resolved' && to === 'In Progress') return 'Report reopened for further work';
  return `Status changed from ${from} to ${to}`;
}
