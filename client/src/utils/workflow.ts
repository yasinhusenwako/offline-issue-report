import { ReportStatus, UserRole } from '../types';

export const VALID_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['Assigned', 'Rejected'],
  Assigned: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: ['In Progress'], // Reopened if maintenance audit fails
  Rejected: [], // Terminal state on backend
};

/**
 * Checks if a status transition is permitted by workflow business rules
 */
export function isValidStatusTransition(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus,
  role: UserRole
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: 'Target status is identical to current status.' };
  }

  // Field workers can only transition Draft -> Submitted
  if (role === 'field_worker') {
    if (currentStatus === 'Draft' && targetStatus === 'Submitted') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Field workers can only submit drafts. Downstream triage is handled by coordinators.',
    };
  }

  // Coordinators can advance through the workflow
  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (allowedNext.includes(targetStatus)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Invalid transition from "${currentStatus}" to "${targetStatus}". Workflow order must be followed.`,
  };
}

/**
 * Gets all permissible next statuses for a given status and user role
 */
export function getAvailableStatusTransitions(
  currentStatus: ReportStatus,
  role: UserRole
): ReportStatus[] {
  if (role === 'field_worker') {
    return currentStatus === 'Draft' ? ['Submitted'] : [];
  }

  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}
