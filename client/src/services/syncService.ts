import { db } from '../db';
import { ActivityLog, ReportItem, SyncActionType, SyncQueueItem } from '../types';
import { apiService } from './api';

export type SyncEventListener = (state: { isSyncing: boolean; pendingCount: number; lastSyncTime: string | null }) => void;

class SyncService {
  private isProcessing = false;
  private listeners: Set<SyncEventListener> = new Set();
  private lastSyncTime: string | null = null;

  constructor() {
    // Restore last sync time from localStorage
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
      .filter((item) => item.status === 'Pending' || item.status === 'Failed' || item.status === 'Synchronizing')
      .count();
  }

  public getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  /**
   * Enqueue a report for remote synchronization
   */
  public async enqueue(
    report: ReportItem,
    action: SyncActionType = 'create',
    options?: { userName?: string; userRole?: 'field_worker' | 'coordinator' }
  ): Promise<void> {
    const queueItemId = `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const queueItem: SyncQueueItem = {
      id: queueItemId,
      reportId: report.id,
      action,
      payload: report,
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

    // Trigger processing if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Process all queued items sequentially
   */
  public async processQueue(): Promise<{
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
      const items = await db.syncQueue
        .filter((item) => item.status === 'Pending' || item.status === 'Failed')
        .toArray();

      for (const item of items) {
        try {
          // Mark queue item as Synchronizing
          await db.syncQueue.update(item.id, {
            status: 'Synchronizing',
            lastAttemptAt: new Date().toISOString(),
            attempts: item.attempts + 1,
          });

          await db.reports.update(item.reportId, {
            syncStatus: 'Synchronizing',
          });

          this.notify();

          // Attempt remote call
          await apiService.syncReport(item);

          // Success: Remove from queue & mark report as Synchronized
          await db.syncQueue.delete(item.id);

          await db.reports.update(item.reportId, {
            syncStatus: 'Synchronized',
            syncError: undefined,
            updatedAt: new Date().toISOString(),
          });

          // Log Activity
          const log: ActivityLog = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            reportId: item.reportId,
            reportTitle: item.payload.title || item.reportId,
            action: 'report_synchronized',
            description: `Report successfully synchronized to central server (Attempt ${item.attempts + 1})`,
            timestamp: new Date().toISOString(),
            userName: item.payload.authorName || 'System Sync',
            userRole: 'field_worker',
          };
          await db.activities.add(log);

          succeeded++;
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown synchronization error';

          await db.syncQueue.update(item.id, {
            status: 'Failed',
            errorMessage: errorMsg,
          });

          await db.reports.update(item.reportId, {
            syncStatus: 'Failed',
            syncError: errorMsg,
          });

          // Log failed sync
          const log: ActivityLog = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            reportId: item.reportId,
            reportTitle: item.payload.title || item.reportId,
            action: 'sync_failed',
            description: `Synchronization failed: ${errorMsg}`,
            timestamp: new Date().toISOString(),
            userName: item.payload.authorName || 'System Sync',
            userRole: 'field_worker',
            metadata: { error: errorMsg, attempts: item.attempts + 1 },
          };
          await db.activities.add(log);

          failed++;
        }
      }

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('infrasync_last_sync_time', this.lastSyncTime);
    } finally {
      this.isProcessing = false;
      this.notify();
    }

    return { processed: succeeded + failed, succeeded, failed };
  }

  /**
   * Retry a specific failed sync item
   */
  public async retryItem(queueItemId: string): Promise<boolean> {
    const item = await db.syncQueue.get(queueItemId);
    if (!item) return false;

    await db.syncQueue.update(queueItemId, {
      status: 'Pending',
      errorMessage: undefined,
    });

    this.processQueue();
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
