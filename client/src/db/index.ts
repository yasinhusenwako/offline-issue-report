import Dexie, { type Table } from 'dexie';
import { ActivityLog, AppSettings, ReportItem, SyncQueueItem } from '../types';

export class InfraSyncDatabase extends Dexie {
  reports!: Table<ReportItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  activities!: Table<ActivityLog, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('InfraSyncDatabase');
    this.version(1).stores({
      reports: 'id, category, priority, status, syncStatus, reportedAt, updatedAt, isDraft',
      syncQueue: 'id, reportId, status, createdAt, attempts',
      activities: 'id, reportId, action, timestamp, userRole',
      settings: 'id',
    });
    this.version(2).stores({
      reports: 'id, clientReportId, serverId, category, priority, status, syncStatus, reportedAt, updatedAt, isDraft',
      syncQueue: 'id, reportId, status, createdAt, attempts, nextRetryAt',
      activities: 'id, reportId, action, timestamp, userRole',
      settings: 'id',
    });
  }
}

export const db = new InfraSyncDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  workerName: 'Elena Rostova',
  workerId: 'FW-8492',
  department: 'Northern Sector Utilities',
  autoSyncEnabled: true,
  syncIntervalSeconds: 30,
  mockNetworkLatencyMs: 0,
  simulateOffline: false,
  simulateFailureRatePercent: 0,
};

/**
 * Ensures default settings exist in IndexedDB without seeding fake mock reports.
 * Real reports are fetched from the backend API when online and persisted locally.
 */
export async function initializeDatabase() {
  const existingSettings = await db.settings.get('app_settings');
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}
