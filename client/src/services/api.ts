import { ReportItem, SyncQueueItem, UserRole } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_API_BASE_URL = import.meta.env?.PROD
  ? 'https://offline-issue-report.vercel.app/api'
  : 'http://localhost:4000/api';

const API_BASE_URL =
  (
    (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
    (import.meta.env?.VITE_API_URL as string | undefined) ||
    DEFAULT_API_BASE_URL
  ).replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 15_000;
const REPORT_META_KEY = 'infrasync_report_meta_map';

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface ServerReport {
  id: string;
  client_report_id: string;
  category: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';
  reported_at: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  rejection_reason: string | null;
  version: number;
}

export interface ServerActivity {
  id: string;
  report_id: string;
  action_type: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string;
  performed_by: string | null;
  created_at: string;
}

interface ReportSyncMeta {
  clientReportId: string;
  serverId?: string;
  version: number;
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getMetaMap(): Record<string, ReportSyncMeta> {
  try {
    const raw = localStorage.getItem(REPORT_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReportSyncMeta>) : {};
  } catch {
    return {};
  }
}

function saveMetaMap(map: Record<string, ReportSyncMeta>): void {
  try {
    localStorage.setItem(REPORT_META_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function getOrCreateReportMeta(localReportId: string, existingClientReportId?: string): ReportSyncMeta {
  const map = getMetaMap();
  if (!map[localReportId]) {
    map[localReportId] = {
      clientReportId: existingClientReportId || generateUuid(),
      version: 1,
    };
    saveMetaMap(map);
  } else if (existingClientReportId && map[localReportId].clientReportId !== existingClientReportId) {
    map[localReportId].clientReportId = existingClientReportId;
    saveMetaMap(map);
  }
  return map[localReportId];
}

export function updateReportMeta(localReportId: string, patch: Partial<ReportSyncMeta>): ReportSyncMeta {
  const map = getMetaMap();
  const current = map[localReportId] ?? {
    clientReportId: generateUuid(),
    version: 1,
  };
  const updated = { ...current, ...patch };
  map[localReportId] = updated;
  saveMetaMap(map);
  return updated;
}

/**
 * Centralized API Client:
 * Connects the offline-first React client to the InfraSync Express + Supabase backend.
 */
class ApiService {
  private getSettings() {
    try {
      const stored = localStorage.getItem('infrasync_mock_settings');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return {
      mockNetworkLatencyMs: 0,
      simulateOffline: false,
      simulateFailureRatePercent: 0,
    };
  }

  private getCurrentRole(overrideRole?: UserRole): UserRole {
    if (overrideRole) return overrideRole;
    try {
      const saved = localStorage.getItem('infrasync_user_role');
      if (saved === 'coordinator' || saved === 'field_worker') return saved;
    } catch {
      // Fallback
    }
    return 'field_worker';
  }

  private async checkSimulatedNetworkConditions() {
    const settings = this.getSettings();
    if (settings.simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      throw new ApiClientError(
        'Network request failed: Device is offline or server is unreachable.',
        0,
        'OFFLINE'
      );
    }
    if (settings.simulateFailureRatePercent > 0 && Math.random() * 100 < settings.simulateFailureRatePercent) {
      throw new ApiClientError(
        '503 Service Unavailable: Simulated synchronization failure. Queued for retry.',
        503,
        'SIMULATED_FAILURE'
      );
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit & { role?: UserRole; timeoutMs?: number } = {}
  ): Promise<T> {
    await this.checkSimulatedNetworkConditions();

    const token = await this.getAuthToken();
    const { role, headers, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Role': this.getCurrentRole(role),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(headers || {}),
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = json?.error?.message || `Request failed with status ${response.status}`;
        const errCode = json?.error?.code || 'API_ERROR';
        const details = json?.error?.details;
        const formattedDetails = Array.isArray(details)
          ? details.map((d: { field?: string; message?: string }) => `${d.field}: ${d.message}`).join('; ')
          : '';

        throw new ApiClientError(
          formattedDetails ? `${errMsg} (${formattedDetails})` : errMsg,
          response.status,
          errCode,
          details
        );
      }

      return json as T;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError(`Request timed out after ${timeoutMs / 1000}s`, 408, 'TIMEOUT');
      }
      throw new ApiClientError(
        err instanceof Error ? err.message : 'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timer);
    }
  }

  public toServerReportPayload(report: Partial<ReportItem>, clientReportId: string) {
    const locationStr =
      report.location?.address?.trim() ||
      (report.location?.latitude != null && report.location?.longitude != null
        ? `${report.location.latitude}, ${report.location.longitude}`
        : 'Unknown location');

    const rawDesc = (report.description || report.title || '').trim();
    const description =
      rawDesc.length >= 10
        ? rawDesc
        : `${rawDesc}${report.title && rawDesc !== report.title ? ` - ${report.title}` : ' (field report)'}`.padEnd(10, '.');

    return {
      client_report_id: clientReportId,
      category: report.category || 'Other',
      description,
      location: locationStr,
      priority: report.priority || 'Medium',
      status: report.status || 'Submitted',
      reported_at: report.reportedAt || new Date().toISOString(),
      created_at: report.reportedAt || new Date().toISOString(),
      updated_at: report.updatedAt || new Date().toISOString(),
    };
  }

  async fetchReports(limit = 100): Promise<ServerReport[]> {
    const res = await this.request<{ success: boolean; data: ServerReport[] }>(
      `/reports?limit=${limit}`,
      { method: 'GET' }
    );
    return res.data ?? [];
  }

  async fetchReportById(serverId: string): Promise<ServerReport & { activity?: ServerActivity[] }> {
    const res = await this.request<{
      success: boolean;
      data: ServerReport & { activity?: ServerActivity[] };
    }>(`/reports/${serverId}`, { method: 'GET' });
    return res.data;
  }

  async syncBatch(
    reports: Array<ReturnType<ApiService['toServerReportPayload']>>,
    role?: UserRole
  ): Promise<{
    total: number;
    created: number;
    duplicates: number;
    failed: number;
    results: Array<{
      client_report_id: string;
      status: 'created' | 'duplicate' | 'failed';
      server_report_id?: string;
      error?: string;
    }>;
  }> {
    const res = await this.request<{
      success: boolean;
      data: {
        total: number;
        created: number;
        duplicates: number;
        failed: number;
        results: Array<{
          client_report_id: string;
          status: 'created' | 'duplicate' | 'failed';
          server_report_id?: string;
          error?: string;
        }>;
      };
    }>('/sync/reports', {
      method: 'POST',
      role,
      body: JSON.stringify({ reports }),
    });
    return res.data;
  }

  /**
   * Synchronize a queued item to the remote backend
   */
  async syncReport(
    queueItem: SyncQueueItem,
    role?: UserRole
  ): Promise<{ success: boolean; remoteId: string; version: number; syncedAt: string }> {
    const payload = queueItem.payload;
    const meta = getOrCreateReportMeta(queueItem.reportId, payload.clientReportId);
    const effectiveRole = role || queueItem.userRole;
    let serverId = payload.serverId || meta.serverId;
    let version = payload.version ?? meta.version ?? 1;

    // 1. Create / ensure report exists on server via idempotent sync endpoint
    if (queueItem.action === 'create' || !serverId) {
      const serverPayload = this.toServerReportPayload(payload, meta.clientReportId);
      const batchData = await this.syncBatch([serverPayload], effectiveRole);
      const itemResult = batchData.results[0];

      if (!itemResult || itemResult.status === 'failed' || !itemResult.server_report_id) {
        throw new ApiClientError(
          itemResult?.error || 'Failed to synchronize report',
          422,
          'SYNC_FAILED'
        );
      }

      serverId = itemResult.server_report_id;
      const updated = updateReportMeta(queueItem.reportId, {
        serverId,
        version,
      });

      if (queueItem.action === 'create') {
        return {
          success: true,
          remoteId: updated.serverId!,
          version: updated.version,
          syncedAt: new Date().toISOString(),
        };
      }
    }

    // 2. Handle assignment / field updates
    if (queueItem.action === 'update') {
      if (payload.assignedTo && payload.status === 'Assigned') {
        const assignRes = await this.request<{
          success: boolean;
          data: { id: string; version: number };
        }>(`/reports/${serverId}/assign`, {
          method: 'PATCH',
          role: effectiveRole || 'coordinator',
          body: JSON.stringify({
            assigned_to: payload.assignedTo,
            version,
          }),
        });
        version = assignRes.data.version;
        updateReportMeta(queueItem.reportId, { serverId, version });
      } else {
        const serverPayload = this.toServerReportPayload(payload, meta.clientReportId);
        const patchRes = await this.request<{
          success: boolean;
          data: { id: string; version: number };
        }>(`/reports/${serverId}`, {
          method: 'PATCH',
          role: effectiveRole,
          body: JSON.stringify({
            category: serverPayload.category,
            description: serverPayload.description,
            location: serverPayload.location,
            priority: serverPayload.priority,
            version,
          }),
        });
        version = patchRes.data.version;
        updateReportMeta(queueItem.reportId, { serverId, version });
      }
    }

    // 3. Handle status transitions
    if (queueItem.action === 'status_change' && payload.status) {
      const statusRes = await this.request<{
        success: boolean;
        data: { id: string; version: number };
      }>(`/reports/${serverId}/status`, {
        method: 'PATCH',
        role: effectiveRole,
        body: JSON.stringify({
          status: payload.status,
          rejection_reason: payload.rejectionReason,
          notes: payload.resolutionNotes,
          reopen: payload.status === 'In Progress' ? true : undefined,
          version,
        }),
      });
      version = statusRes.data.version;
      updateReportMeta(queueItem.reportId, { serverId, version });
    }

    return {
      success: true,
      remoteId: serverId!,
      version,
      syncedAt: new Date().toISOString(),
    };
  }

  async updateRemoteStatus(
    reportId: string,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; updatedAt: string }> {
    const meta = getOrCreateReportMeta(reportId);
    const targetId = meta.serverId || reportId;

    const res = await this.request<{
      success: boolean;
      data: { version: number; updated_at: string };
    }>(`/reports/${targetId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        notes,
        version: meta.version,
      }),
    });

    updateReportMeta(reportId, { version: res.data.version });
    return {
      success: true,
      updatedAt: res.data.updated_at || new Date().toISOString(),
    };
  }

  async assignRemoteReport(
    reportId: string,
    technician: string
  ): Promise<{ success: boolean; updatedAt: string }> {
    const meta = getOrCreateReportMeta(reportId);
    const targetId = meta.serverId || reportId;

    const res = await this.request<{
      success: boolean;
      data: { version: number; updated_at: string };
    }>(`/reports/${targetId}/assign`, {
      method: 'PATCH',
      role: 'coordinator',
      body: JSON.stringify({
        assigned_to: technician,
        version: meta.version,
      }),
    });

    updateReportMeta(reportId, { version: res.data.version });
    return {
      success: true,
      updatedAt: res.data.updated_at || new Date().toISOString(),
    };
  }

  async ping(): Promise<{ status: 'healthy' | 'degraded'; latencyMs: number }> {
    const start = performance.now();
    const res = await this.request<{ status: string }>('/health', {
      method: 'GET',
      timeoutMs: 5000,
    });
    const latency = Math.round(performance.now() - start);
    return {
      status: res.status === 'ok' ? 'healthy' : 'degraded',
      latencyMs: latency,
    };
  }
}

export const apiService = new ApiService();
