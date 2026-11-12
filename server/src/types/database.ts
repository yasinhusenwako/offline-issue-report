// ─── Database Types ───────────────────────────────────────────────────────────
// Matches the existing Supabase PostgreSQL schema for InfraSync.

export type ReportStatus =
  | 'Draft'
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'field_worker' | 'coordinator';

export type SyncOperationStatus = 'Pending' | 'Completed' | 'Failed';

// ─── Table Row Types ──────────────────────────────────────────────────────────

export type Report = {
  id: string;
  client_report_id: string;
  category: string;
  description: string;
  location: string;
  priority: ReportPriority;
  status: ReportStatus;
  reported_at: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  rejection_reason: string | null;
  version: number;
};

export type ReportActivity = {
  id: string;
  report_id: string;
  action_type: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string;
  performed_by: string | null;
  created_at: string;
};

export type SyncOperation = {
  id: string;
  client_report_id: string;
  report_id: string | null;
  idempotency_key: string;
  operation_type: string;
  sync_status: SyncOperationStatus;
  attempt_count: number;
  last_attempt_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Supabase DB interface (for typed client) ─────────────────────────────────

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: Report;
        Insert: {
          id?: string;
          client_report_id: string;
          category: string;
          description: string;
          location: string;
          priority?: ReportPriority;
          status?: ReportStatus;
          reported_at?: string;
          created_at?: string;
          updated_at?: string;
          assigned_to?: string | null;
          resolved_at?: string | null;
          rejection_reason?: string | null;
          version?: number;
        };
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
        Relationships: [];
      };
      report_activity: {
        Row: ReportActivity;
        Insert: {
          id?: string;
          report_id: string;
          action_type: string;
          previous_value?: Record<string, unknown> | null;
          new_value?: Record<string, unknown> | null;
          description: string;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<ReportActivity, 'id' | 'created_at'>>;
        Relationships: [];
      };
      sync_operations: {
        Row: SyncOperation;
        Insert: {
          id?: string;
          client_report_id: string;
          report_id?: string | null;
          idempotency_key: string;
          operation_type?: string;
          sync_status?: SyncOperationStatus;
          attempt_count?: number;
          last_attempt_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SyncOperation, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
