export type UserRole = 'field_worker' | 'coordinator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type ReportCategory =
  | 'Water Point'
  | 'Equipment Damage'
  | 'Service Interruption'
  | 'Safety Concern'
  | 'Maintenance Requirement'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportStatus =
  | 'Draft'
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type SyncState = 'Pending' | 'Synchronizing' | 'Synchronized' | 'Failed' | 'Conflict';

export interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
}

export interface ReportItem {
  id: string; // Local ID e.g. "REP-2026-0104" or UUID
  clientReportId?: string; // Stable UUID idempotency key for backend sync
  serverId?: string; // Server-assigned UUID after sync
  version?: number; // Optimistic concurrency version
  conflictServerData?: Partial<ReportItem> & { version?: number; updatedAt?: string };
  title: string;
  category: ReportCategory;
  description: string;
  location: LocationData;
  priority: PriorityLevel;
  status: ReportStatus;
  syncStatus: SyncState;
  syncError?: string;
  reportedAt: string; // ISO date string
  updatedAt: string; // ISO date string
  authorName: string;
  authorId: string;
  assignedTo?: string; // Technician or crew name
  assignedAt?: string;
  resolutionNotes?: string;
  rejectionReason?: string;
  resolvedAt?: string;
  isDraft: boolean;
  isFavorite?: boolean;
  images?: string[]; // base64 or blob preview urls
}

export type SyncActionType = 'create' | 'update' | 'status_change';

export interface SyncQueueItem {
  id: string;
  reportId: string;
  action: SyncActionType;
  payload: Partial<ReportItem>;
  userRole?: UserRole;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  status: SyncState;
  errorMessage?: string;
}

export type ActivityActionType =
  | 'report_created'
  | 'report_drafted'
  | 'report_submitted'
  | 'report_synchronized'
  | 'sync_failed'
  | 'report_assigned'
  | 'status_changed'
  | 'report_resolved'
  | 'report_rejected';

export interface ActivityLog {
  id: string;
  reportId: string;
  reportTitle?: string;
  action: ActivityActionType;
  description: string;
  timestamp: string; // ISO string
  userName: string;
  userRole: UserRole;
  metadata?: Record<string, unknown>;
}

export interface AppSettings {
  id: string;
  workerName: string;
  workerId: string;
  department: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  mockNetworkLatencyMs: number;
  simulateOffline: boolean;
  simulateFailureRatePercent: number;
}
