import { UserRole } from './database';

// ─── Express Request Augmentation ─────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: DevUser;
    }
  }
}

export interface DevUser {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Query Parameters ─────────────────────────────────────────────────────────

export interface ReportFilters {
  category?: string;
  priority?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  submittedBy?: string;
  assignedTo?: string;
}

// ─── Sync Types ───────────────────────────────────────────────────────────────

export interface SyncReportItem {
  client_report_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  location_description?: string | null;
  submitted_by?: string | null;
  submitted_by_role?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface SyncBatchRequest {
  reports: SyncReportItem[];
  device_id?: string;
}

export interface SyncResultItem {
  client_report_id: string;
  status: 'created' | 'duplicate' | 'failed';
  server_report_id?: string;
  error?: string;
}

export interface SyncBatchResponse {
  total: number;
  created: number;
  duplicates: number;
  failed: number;
  results: SyncResultItem[];
}

