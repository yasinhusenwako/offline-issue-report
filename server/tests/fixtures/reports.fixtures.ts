import { v4 as uuidv4 } from 'uuid';
import { Report, ReportActivity, SyncOperation } from '../../src/types/database';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export function makeReport(overrides: Partial<Report> = {}): Report {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    client_report_id: uuidv4(),
    category: 'Water Point',
    description: 'Large pothole blocking the main road near the school entrance',
    location: '123 Main St, Deder, Oromia',
    priority: 'High',
    status: 'Draft',
    reported_at: now,
    created_at: now,
    updated_at: now,
    assigned_to: null,
    resolved_at: null,
    rejection_reason: null,
    version: 1,
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<ReportActivity> = {}): ReportActivity {
  return {
    id: uuidv4(),
    report_id: uuidv4(),
    action_type: 'CREATED',
    previous_value: null,
    new_value: { status: 'Draft' },
    description: 'Report created',
    performed_by: 'dev-field-worker-id',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeSyncOp(overrides: Partial<SyncOperation> = {}): SyncOperation {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    client_report_id: uuidv4(),
    report_id: null,
    idempotency_key: uuidv4(),
    operation_type: 'CREATE',
    sync_status: 'Pending',
    attempt_count: 1,
    last_attempt_at: now,
    last_error: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function makeCreateReportBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    client_report_id: uuidv4(),
    category: 'Equipment Damage',
    description: 'The safety rail on the south side of the bridge has collapsed and poses a danger to pedestrians.',
    location: 'Bridge Road, Nairobi',
    priority: 'Critical',
    status: 'Draft',
    ...overrides,
  };
}
