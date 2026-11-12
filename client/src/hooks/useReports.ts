import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ActivityLog, PriorityLevel, ReportCategory, ReportItem, ReportStatus, SyncQueueItem, SyncState } from '../types';

export interface ReportFilterOptions {
  search?: string;
  category?: ReportCategory | 'all';
  priority?: PriorityLevel | 'all';
  status?: ReportStatus | 'all';
  syncStatus?: SyncState | 'all';
  includeDrafts?: boolean;
  sortBy?: 'reportedAt' | 'priority' | 'status' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export function useReports(filters: ReportFilterOptions = {}) {
  const reports = useLiveQuery(async () => {
    let collection = db.reports.toCollection();

    let items = await collection.toArray();

    // Search filter (ID, Title, Description, Location)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.address.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      items = items.filter((r) => r.category === filters.category);
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      items = items.filter((r) => r.priority === filters.priority);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      items = items.filter((r) => r.status === filters.status);
    }

    // Sync state filter
    if (filters.syncStatus && filters.syncStatus !== 'all') {
      items = items.filter((r) => r.syncStatus === filters.syncStatus);
    }

    // Drafts inclusion
    if (filters.includeDrafts === false) {
      items = items.filter((r) => !r.isDraft);
    }

    // Sorting
    const priorityWeight: Record<PriorityLevel, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const sortBy = filters.sortBy || 'reportedAt';
    const sortOrder = filters.sortOrder || 'desc';

    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'priority') {
        cmp = priorityWeight[a.priority] - priorityWeight[b.priority];
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortBy === 'updatedAt') {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        cmp = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [
    filters.search,
    filters.category,
    filters.priority,
    filters.status,
    filters.syncStatus,
    filters.includeDrafts,
    filters.sortBy,
    filters.sortOrder,
  ]);

  return {
    reports: reports || [],
    isLoading: reports === undefined,
  };
}

export function useReport(reportId: string | undefined) {
  const report = useLiveQuery(async () => {
    if (!reportId) return null;
    return await db.reports.get(reportId);
  }, [reportId]);

  return {
    report,
    isLoading: report === undefined,
  };
}

export function useSyncQueueItems() {
  const items = useLiveQuery(async () => {
    return await db.syncQueue.toArray();
  });

  return {
    queueItems: items || [],
    isLoading: items === undefined,
  };
}

export function useActivities(reportId?: string) {
  const activities = useLiveQuery(async () => {
    let list: ActivityLog[];
    if (reportId) {
      list = await db.activities.where('reportId').equals(reportId).toArray();
    } else {
      list = await db.activities.toArray();
    }
    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reportId]);

  return {
    activities: activities || [],
    isLoading: activities === undefined,
  };
}
