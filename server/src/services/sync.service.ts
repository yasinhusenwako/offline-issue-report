import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { SyncBatchInput } from '../validators/report.validators';
import { SyncBatchResponse, SyncResultItem } from '../types/api';
import { ReportPriority, ReportStatus, UserRole } from '../types/database';
import { recordActivity } from './report.service';

// ─── Sync Service ─────────────────────────────────────────────────────────────

export async function syncReportsBatch(
  input: SyncBatchInput,
  performedBy: string,
  _performedByRole: UserRole
): Promise<SyncBatchResponse> {
  const results: SyncResultItem[] = [];
  let created = 0;
  let duplicates = 0;
  let failed = 0;

  // Process each report independently — partial success is preserved
  for (const reportData of input.reports) {
    const syncOpId = uuidv4();
    const now = new Date().toISOString();

    // 1. Record sync attempt in sync_operations
    await supabase.from('sync_operations').insert({
      id: syncOpId,
      client_report_id: reportData.client_report_id,
      report_id: null,
      idempotency_key: uuidv4(),
      operation_type: 'CREATE',
      sync_status: 'Pending',
      attempt_count: 1,
      last_attempt_at: now,
      created_at: now,
      updated_at: now,
    });

    // 2. Check for existing record (idempotency key = client_report_id)
    const { data: existing, error: lookupError } = await supabase
      .from('reports')
      .select('id, client_report_id')
      .eq('client_report_id', reportData.client_report_id)
      .maybeSingle();

    if (lookupError) {
      await markSyncFailed(syncOpId, lookupError.message);
      results.push({
        client_report_id: reportData.client_report_id,
        status: 'failed',
        error: 'Database lookup failed',
      });
      failed++;
      continue;
    }

    // 3. Duplicate: return existing reference without creating a new record
    if (existing) {
      await markSyncSuccess(syncOpId, existing.id);
      results.push({
        client_report_id: reportData.client_report_id,
        status: 'duplicate',
        server_report_id: existing.id,
      });
      duplicates++;
      continue;
    }

    // 4. Create the report
    const reportId = uuidv4();
    const { error: insertError } = await supabase.from('reports').insert({
      id: reportId,
      client_report_id: reportData.client_report_id,
      category: reportData.category,
      description: reportData.description,
      location: reportData.location,
      priority: (reportData.priority as ReportPriority) ?? 'Medium',
      status: (reportData.status as ReportStatus) ?? 'Draft',
      reported_at: reportData.reported_at ?? now,
      created_at: reportData.created_at ?? now,
      updated_at: reportData.updated_at ?? now,
      version: 1,
    });

    if (insertError) {
      await markSyncFailed(syncOpId, insertError.message);
      results.push({
        client_report_id: reportData.client_report_id,
        status: 'failed',
        error: insertError.message.includes('duplicate')
          ? 'Duplicate detected during insert'
          : `Failed to save report: ${insertError.message}`,
      });
      failed++;
      continue;
    }

    // 5. Record activity and update sync op
    await recordActivity({
      report_id: reportId,
      action_type: 'SYNCED',
      performed_by: performedBy,
      new_value: { synced_via: 'batch', client_report_id: reportData.client_report_id },
      description: 'Report synced from offline client',
    });

    await markSyncSuccess(syncOpId, reportId);

    results.push({
      client_report_id: reportData.client_report_id,
      status: 'created',
      server_report_id: reportId,
    });
    created++;
  }

  return {
    total: input.reports.length,
    created,
    duplicates,
    failed,
    results,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markSyncSuccess(syncOpId: string, reportId: string): Promise<void> {
  await supabase
    .from('sync_operations')
    .update({
      sync_status: 'Completed',
      report_id: reportId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', syncOpId);
}

async function markSyncFailed(syncOpId: string, errorMessage: string): Promise<void> {
  await supabase
    .from('sync_operations')
    .update({
      sync_status: 'Failed',
      last_error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', syncOpId);
}
