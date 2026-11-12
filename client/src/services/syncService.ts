import { db } from '../db';
import { ActivityLog, ReportCategory, ReportItem, SyncActionType, SyncQueueItem, UserRole } from '../types';
import {
  ApiClientError,
  apiService,
  generateUuid,
  getOrCreateReportMeta,
  ServerReport,
  updateReportMeta,
} from './api';

export type SyncEventListener = (state: {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
}) => void;

const MAX_BACKOFF_MS = 60_000;
const BASE_BACKOFF_MS = 1_000;

function computeNextRetryIso(attempts: number): string {
  const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempts), MAX_BACKOFF_MS);
  return new Date(Date.now() + delay).toISOString();
}

function mapServerReportToLocal(sr: ServerReport, existing?: ReportItem): ReportItem {
  const firstSentence = sr.description.split(/[.!?]\s/)[0] || sr.description;
  const derivedTitle =
    existing?.title ||
    (firstSentence.length > 64 ? `${firstSentence.slice(0, 61)}...` : firstSentence);

  return {
    id: existing?.id || sr.id,
    clientReportId: sr.client_report_id,
    serverId: sr.id,
    version: sr.version,
    title: derivedTitle,
    category: (sr.category as ReportCategory) || 'Other',
    description: sr.description,
    location: {
      address: sr.location,
      latitude: existing?.location?.latitude,
      longitude: existing?.location?.longitude,
      accuracyMeters: existing?.location?.accuracyMeters,
    },
    priority: sr.priority,
    status: sr.status,
    syncStatus: 'Synchronized',
    syncError: undefined,
    conflictServerData: undefined,
    reportedAt: sr.reported_at || sr.created_at,
    updatedAt: sr.updated_at,
    authorName: existing?.authorName || 'Field Reporter',
    authorId: existing?.authorId || 'REMOTE',
    assignedTo: sr.assigned_to ?? undefined,
    assignedAt: existing?.assignedAt,
    resolutionNotes: existing?.resolutionNotes,
    rejectionReason: sr.rejection_reason ?? undefined,
    resolvedAt: sr.resolved_at ?? undefined,
    isDraft: sr.status === 'Draft',
    isFavorite: existing?.isFavorite,
    images: existing?.images,
  };
}

class SyncService {
  private isProcessing = false;
  private listeners: Set<SyncEventListener> = new Set();
  private lastSyncTime: string | null = null;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.lastSyncTime = localStorage.getItem('infrasync_last_sync_time');
  }

  public subscribe(listener: SyncEventListener) {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.getPendingCount().then((count) => {
      this.listeners.forEach((fn) =>
        fn({
          isSyncing: this.isProcessing,
          pendingCount: count,
          lastSyncTime: this.lastSyncTime,
        })
      );
    });
  }

  public async getPendingCount(): Promise<number> {
    return await db.syncQueue
      .filter(
        (item) =>
          item.status === 'Pending' ||
          item.status === 'Failed' ||
          item.status === 'Synchronizing' ||
          item.status === 'Conflict'
      )
      .count();
  }

  public getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  /**
   * Start periodic background sync while the app is active.
   */
  public startAutoSync(intervalMs = 30_000): () => void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }

    // Startup sync
    void this.syncAll();

    this.autoSyncTimer = setInterval(() => {
      void this.syncAll();
    }, intervalMs);

    return () => {
      if (this.autoSyncTimer) {
        clearInterval(this.autoSyncTimer);
        this.autoSyncTimer = null;
      }
    };
  }

  public async syncAll(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    await this.processQueue();
    await this.pullFromServer();
  }

  /**
   * Enqueue a report for remote synchronization
   */
  public async enqueue(
    report: ReportItem,
    action: SyncActionType = 'create',
    options?: { userName?: string; userRole?: UserRole }
  ): Promise<void> {
    const clientReportId = report.clientReportId || generateUuid();
    if (!report.clientReportId) {
      await db.reports.update(report.id, { clientReportId });
      report = { ...report, clientReportId };
    }
    getOrCreateReportMeta(report.id, clientReportId);

    const queueItemId = `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const queueItem: SyncQueueItem = {
      id: queueItemId,
      reportId: report.id,
      action,
      payload: report,
      userRole: options?.userRole,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 5,
      status: 'Pending',
    };

    await db.transaction('rw', [db.syncQueue, db.reports], async () => {
      await db.syncQueue.put(queueItem);
      await db.reports.update(report.id, {
        syncStatus: 'Pending',
        syncError: undefined,
      });
    });

    this.notify();

    if (typeof navigator === 'undefined' || navigator.onLine) {
      void this.processQueue();
    }
  }

  /**
   * Process queued items: batches pending 'create' items via POST /api/sync/reports,
   * and processes 'update' / 'status_change' items with exponential backoff & 409 conflict detection.
   */
  public async processQueue(ignoreBackoff = false): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    this.notify();

    let succeeded = 0;
    let failed = 0;

    try {
      const nowMs = Date.now();
      const allPending = await db.syncQueue
        .filter((item) => item.status === 'Pending' || item.status === 'Failed')
        .toArray();

      const readyItems = allPending.filter((item) => {
        if (item.attempts >= item.maxAttempts) return false;
        if (!ignoreBackoff && item.nextRetryAt) {
          return new Date(item.nextRetryAt).getTime() <= nowMs;
        }
        return true;
      });

      // 1. Batch sync all ready 'create' items via POST /api/sync/reports
      const createItems = readyItems.filter((item) => item.action === 'create');
      if (createItems.length > 0) {
        const batchResult = await this.processBatchCreates(createItems);
        succeeded += batchResult.succeeded;
        failed += batchResult.failed;
      }

      // 2. Process 'update' and 'status_change' items sequentially
      const mutationItems = readyItems.filter((item) => item.action !== 'create');
      for (const item of mutationItems) {
        const res = await this.processSingleItem(item);
        if (res === 'succeeded') succeeded++;
        else if (res === 'failed') failed++;
      }

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('infrasync_last_sync_time', this.lastSyncTime);
    } finally {
      this.isProcessing = false;
      this.notify();
    }

    return { processed: succeeded + failed, succeeded, failed };
  }

  private async processBatchCreates(
    createItems: SyncQueueItem[]
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;
    const nowIso = new Date().toISOString();

    const batchPayload: Array<ReturnType<typeof apiService.toServerReportPayload>> = [];
    const itemByClientId = new Map<string, SyncQueueItem>();

    for (const item of createItems) {
      const meta = getOrCreateReportMeta(item.reportId, item.payload.clientReportId);
      itemByClientId.set(meta.clientReportId, item);
      batchPayload.push(apiService.toServerReportPayload(item.payload, meta.clientReportId));

      await db.syncQueue.update(item.id, {
        status: 'Synchronizing',
        lastAttemptAt: nowIso,
        attempts: item.attempts + 1,
      });
      await db.reports.update(item.reportId, { syncStatus: 'Synchronizing' });
    }
    this.notify();

    try {
      const batchRes = await apiService.syncBatch(batchPayload, createItems[0]?.userRole);

      for (const result of batchRes.results) {
        const item = itemByClientId.get(result.client_report_id);
        if (!item) continue;

        if (
          (result.status === 'created' || result.status === 'duplicate') &&
          result.server_report_id
        ) {
          updateReportMeta(item.reportId, {
            serverId: result.server_report_id,
            version: item.payload.version ?? 1,
          });
          await db.syncQueue.delete(item.id);
          await db.reports.update(item.reportId, {
            serverId: result.server_report_id,
            clientReportId: result.client_report_id,
            version: item.payload.version ?? 1,
            syncStatus: 'Synchronized',
            syncError: undefined,
            updatedAt: new Date().toISOString(),
          });

          await db.activities.add({
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            reportId: item.reportId,
            reportTitle: item.payload.title || item.reportId,
            action: 'report_synchronized',
            description:
              result.status === 'duplicate'
                ? 'Report matched existing server record (idempotent sync)'
                : `Report synchronized to server (ID: ${result.server_report_id})`,
            timestamp: new Date().toISOString(),
            userName: item.payload.authorName || 'System Sync',
            userRole: item.userRole || 'field_worker',
          });
          succeeded++;
        } else {
          await this.handleItemFailure(
            item,
            new Error(result.error || 'Batch item synchronization failed')
          );
          failed++;
        }
      }
    } catch (err: unknown) {
      for (const item of createItems) {
        await this.handleItemFailure(item, err);
        failed++;
      }
    }

    return { succeeded, failed };
  }

  private async processSingleItem(item: SyncQueueItem): Promise<'succeeded' | 'failed'> {
    try {
      await db.syncQueue.update(item.id, {
        status: 'Synchronizing',
        lastAttemptAt: new Date().toISOString(),
        attempts: item.attempts + 1,
      });
      await db.reports.update(item.reportId, { syncStatus: 'Synchronizing' });
      this.notify();

      const result = await apiService.syncReport(item);

      await db.syncQueue.delete(item.id);
      await db.reports.update(item.reportId, {
        serverId: result.remoteId,
        version: result.version,
        syncStatus: 'Synchronized',
        syncError: undefined,
        conflictServerData: undefined,
        updatedAt: result.syncedAt,
      });

      await db.activities.add({
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reportId: item.reportId,
        reportTitle: item.payload.title || item.reportId,
        action: 'report_synchronized',
        description: `Report synchronized to server (v${result.version})`,
        timestamp: result.syncedAt,
        userName: item.payload.authorName || 'System Sync',
        userRole: item.userRole || 'field_worker',
      });

      return 'succeeded';
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.statusCode === 409) {
        await this.handleVersionConflict(item, err);
        return 'failed';
      }
      await this.handleItemFailure(item, err);
      return 'failed';
    }
  }

  private async handleVersionConflict(item: SyncQueueItem, err: ApiClientError): Promise<void> {
    const meta = getOrCreateReportMeta(item.reportId, item.payload.clientReportId);
    const serverId = item.payload.serverId || meta.serverId;
    let serverSnapshot: Partial<ReportItem> & { version?: number; updatedAt?: string } = {
      version: (err.details as { serverVersion?: number } | undefined)?.serverVersion,
    };

    if (serverId) {
      try {
        const remote = await apiService.fetchReportById(serverId);
        serverSnapshot = {
          category: remote.category as ReportCategory,
          description: remote.description,
          location: { address: remote.location },
          priority: remote.priority,
          status: remote.status,
          assignedTo: remote.assigned_to ?? undefined,
          rejectionReason: remote.rejection_reason ?? undefined,
          version: remote.version,
          updatedAt: remote.updated_at,
        };
      } catch {
        // Keep minimal conflict details if fetch fails
      }
    }

    await db.syncQueue.update(item.id, {
      status: 'Conflict',
      errorMessage: err.message,
    });

    await db.reports.update(item.reportId, {
      syncStatus: 'Conflict',
      syncError: err.message,
      conflictServerData: serverSnapshot,
    });

    await db.activities.add({
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportId: item.reportId,
      reportTitle: item.payload.title || item.reportId,
      action: 'sync_failed',
      description: `Version conflict detected (HTTP 409): ${err.message}`,
      timestamp: new Date().toISOString(),
      userName: item.payload.authorName || 'System Sync',
      userRole: item.userRole || 'field_worker',
      metadata: { conflict: true, serverVersion: serverSnapshot.version },
    });
  }

  private async handleItemFailure(item: SyncQueueItem, err: unknown): Promise<void> {
    const errorMsg = err instanceof Error ? err.message : 'Unknown synchronization error';
    const nextAttempts = item.attempts + 1;
    const exhausted = nextAttempts >= item.maxAttempts;

    await db.syncQueue.update(item.id, {
      status: 'Failed',
      errorMessage: exhausted ? `Max retries reached: ${errorMsg}` : errorMsg,
      nextRetryAt: exhausted ? undefined : computeNextRetryIso(nextAttempts),
    });

    await db.reports.update(item.reportId, {
      syncStatus: 'Failed',
      syncError: errorMsg,
    });

    const log: ActivityLog = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportId: item.reportId,
      reportTitle: item.payload.title || item.reportId,
      action: 'sync_failed',
      description: `Synchronization failed (Attempt ${nextAttempts}/${item.maxAttempts}): ${errorMsg}`,
      timestamp: new Date().toISOString(),
      userName: item.payload.authorName || 'System Sync',
      userRole: item.userRole || 'field_worker',
      metadata: { error: errorMsg, attempts: nextAttempts },
    };
    await db.activities.add(log);
  }

  /**
   * Resolve a version conflict for a report safely without silently discarding either version.
   */
  public async resolveConflict(
    reportId: string,
    strategy: 'keep_server' | 'keep_local'
  ): Promise<void> {
    const localReport = await db.reports.get(reportId);
    if (!localReport) return;

    const conflictItems = await db.syncQueue
      .filter((q) => q.reportId === reportId && q.status === 'Conflict')
      .toArray();

    if (strategy === 'keep_server') {
      const serverData = localReport.conflictServerData;
      if (serverData) {
        const merged: Partial<ReportItem> = {
          category: serverData.category ?? localReport.category,
          description: serverData.description ?? localReport.description,
          location: serverData.location ?? localReport.location,
          priority: serverData.priority ?? localReport.priority,
          status: serverData.status ?? localReport.status,
          assignedTo: serverData.assignedTo ?? localReport.assignedTo,
          rejectionReason: serverData.rejectionReason ?? localReport.rejectionReason,
          version: serverData.version ?? localReport.version,
          updatedAt: serverData.updatedAt ?? new Date().toISOString(),
          syncStatus: 'Synchronized',
          syncError: undefined,
          conflictServerData: undefined,
        };
        await db.reports.update(reportId, merged);
        if (merged.version) {
          updateReportMeta(reportId, { version: merged.version });
        }
      } else {
        await db.reports.update(reportId, {
          syncStatus: 'Synchronized',
          syncError: undefined,
          conflictServerData: undefined,
        });
      }
      for (const q of conflictItems) {
        await db.syncQueue.delete(q.id);
      }
    } else {
      const latestServerVersion = localReport.conflictServerData?.version ?? (localReport.version ?? 1) + 1;
      const updatedLocal: ReportItem = {
        ...localReport,
        version: latestServerVersion,
        syncStatus: 'Pending',
        syncError: undefined,
        conflictServerData: undefined,
      };
      await db.reports.put(updatedLocal);
      updateReportMeta(reportId, { version: latestServerVersion });

      for (const q of conflictItems) {
        await db.syncQueue.update(q.id, {
          status: 'Pending',
          attempts: 0,
          nextRetryAt: undefined,
          errorMessage: undefined,
          payload: updatedLocal,
        });
      }
      void this.processQueue(true);
    }

    this.notify();
  }

  /**
   * Pull latest reports from server into IndexedDB without overwriting local unsynced/conflicted reports.
   */
  public async pullFromServer(): Promise<void> {
    try {
      const serverReports = await apiService.fetchReports(100);
      const localReports = await db.reports.toArray();

      const byClientId = new Map<string, ReportItem>();
      const byServerId = new Map<string, ReportItem>();
      for (const lr of localReports) {
        if (lr.clientReportId) byClientId.set(lr.clientReportId, lr);
        if (lr.serverId) byServerId.set(lr.serverId, lr);
      }

      for (const sr of serverReports) {
        const existing = byServerId.get(sr.id) || byClientId.get(sr.client_report_id);
        if (
          existing &&
          (existing.syncStatus === 'Pending' ||
            existing.syncStatus === 'Synchronizing' ||
            existing.syncStatus === 'Failed' ||
            existing.syncStatus === 'Conflict')
        ) {
          // Never overwrite unsynced local work
          continue;
        }
        const mapped = mapServerReportToLocal(sr, existing);
        await db.reports.put(mapped);
        updateReportMeta(mapped.id, {
          clientReportId: sr.client_report_id,
          serverId: sr.id,
          version: sr.version,
        });
      }
    } catch {
      // Offline or unreachable — local IndexedDB remains accessible
    }
  }

  /**
   * Retry a specific failed sync item immediately (manual retry).
   */
  public async retryItem(queueItemId: string): Promise<boolean> {
    const item = await db.syncQueue.get(queueItemId);
    if (!item) return false;

    await db.syncQueue.update(queueItemId, {
      status: 'Pending',
      attempts: 0,
      nextRetryAt: undefined,
      errorMessage: undefined,
    });

    await this.processQueue(true);
    return true;
  }

  /**
   * Clear all completed/stale queue items
   */
  public async clearCompletedQueue(): Promise<void> {
    const completed = await db.syncQueue.filter((item) => item.status === 'Synchronized').toArray();
    for (const item of completed) {
      await db.syncQueue.delete(item.id);
    }
    this.notify();
  }
}

export const syncService = new SyncService();
