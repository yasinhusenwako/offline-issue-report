import { ReportItem, SyncQueueItem, UserRole } from '../types';

const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:4000/api';

const REPORT_META_KEY = 'infrasync_report_meta_map';

interface ReportSyncMeta {
  clientReportId: string;
  serverId?: string;
  version: number;
}

function generateUuid(): string {
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

function getOrCreateMeta(localReportId: string): ReportSyncMeta {
  const map = getMetaMap();
  if (!map[localReportId]) {
    map[localReportId] = {
      clientReportId: generateUuid(),
      version: 1,
    };
    saveMetaMap(map);
  }
  return map[localReportId];
}

function updateMeta(localReportId: string, patch: Partial<ReportSyncMeta>): ReportSyncMeta {
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
 * API Service Layer:
 * Connects the offline-first client to the InfraSync Express + Supabase backend.
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
    if (settings.simulateOffline || !navigator.onLine) {
      throw new Error('Network request failed: Device is offline or server is unreachable.');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit & { role?: UserRole } = {}
  ): Promise<T> {
    await this.checkSimulatedNetworkConditions();

    const { role, headers, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-Dev-Role': this.getCurrentRole(role),
        ...(headers || {}),
      },
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        json?.error?.message ||
        `Request failed with status ${response.status}`;
      const details = Array.isArray(json?.error?.details)
        ? json.error.details.map((d: { field?: string; message?: string }) => `${d.field}: ${d.message}`).join('; ')
        : '';
      throw new Error(details ? `${errMsg} (${details})` : errMsg);
    }

    return json as T;
  }

  private toServerReportPayload(report: Partial<ReportItem>, clientReportId: string) {
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

  /**
   * Synchronize a queued item to the remote backend
   */
  async syncReport(
    queueItem: SyncQueueItem,
    role?: UserRole
  ): Promise<{ success: boolean; remoteId: string; syncedAt: string }> {
    const meta = getOrCreateMeta(queueItem.reportId);
    const payload = queueItem.payload;

    // 1. Create / ensure report exists on server via idempotent sync endpoint
    if (queueItem.action === 'create' || !meta.serverId) {
      const serverPayload = this.toServerReportPayload(payload, meta.clientReportId);

      const syncRes = await this.request<{
        success: boolean;
        data: {
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
        body: JSON.stringify({ reports: [serverPayload] }),
      });

      const itemResult = syncRes.data.results[0];
      if (!itemResult || itemResult.status === 'failed' || !itemResult.server_report_id) {
        throw new Error(itemResult?.error || 'Failed to synchronize report');
      }

      const updatedMeta = updateMeta(queueItem.reportId, {
        serverId: itemResult.server_report_id,
        version: meta.version || 1,
      });

      // If this was originally an update/status_change for an unsynced report,
      // fetch latest version so follow-up calls stay in sync
      if (queueItem.action === 'create') {
        return {
          success: true,
          remoteId: updatedMeta.serverId!,
          syncedAt: new Date().toISOString(),
        };
      }
    }

    const activeMeta = getOrCreateMeta(queueItem.reportId);
    const serverId = activeMeta.serverId!;

    // 2. Handle assignment / field updates
    if (queueItem.action === 'update') {
      if (payload.assignedTo && payload.status === 'Assigned') {
        const assignRes = await this.request<{
          success: boolean;
          data: { id: string; version: number };
        }>(`/reports/${serverId}/assign`, {
          method: 'PATCH',
          role: role || 'coordinator',
          body: JSON.stringify({
            assigned_to: payload.assignedTo,
            version: activeMeta.version,
          }),
        });
        updateMeta(queueItem.reportId, { version: assignRes.data.version });
      } else {
        const serverPayload = this.toServerReportPayload(payload, activeMeta.clientReportId);
        const patchRes = await this.request<{
          success: boolean;
          data: { id: string; version: number };
        }>(`/reports/${serverId}`, {
          method: 'PATCH',
          role,
          body: JSON.stringify({
            category: serverPayload.category,
            description: serverPayload.description,
            location: serverPayload.location,
            priority: serverPayload.priority,
            version: activeMeta.version,
          }),
        });
        updateMeta(queueItem.reportId, { version: patchRes.data.version });
      }
    }

    // 3. Handle status transitions
    if (queueItem.action === 'status_change' && payload.status) {
      const statusRes = await this.request<{
        success: boolean;
        data: { id: string; version: number };
      }>(`/reports/${serverId}/status`, {
        method: 'PATCH',
        role,
        body: JSON.stringify({
          status: payload.status,
          rejection_reason: payload.rejectionReason,
          notes: payload.resolutionNotes,
          reopen: payload.status === 'In Progress' ? true : undefined,
          version: activeMeta.version,
        }),
      });
      updateMeta(queueItem.reportId, { version: statusRes.data.version });
    }

    return {
      success: true,
      remoteId: serverId,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Update report status on remote backend
   */
  async updateRemoteStatus(
    reportId: string,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; updatedAt: string }> {
    const meta = getOrCreateMeta(reportId);
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

    updateMeta(reportId, { version: res.data.version });
    return {
      success: true,
      updatedAt: res.data.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Assign report on remote backend
   */
  async assignRemoteReport(
    reportId: string,
    technician: string
  ): Promise<{ success: boolean; updatedAt: string }> {
    const meta = getOrCreateMeta(reportId);
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

    updateMeta(reportId, { version: res.data.version });
    return {
      success: true,
      updatedAt: res.data.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Health ping to check remote server connectivity
   */
  async ping(): Promise<{ status: 'healthy' | 'degraded'; latencyMs: number }> {
    const start = performance.now();
    const res = await this.request<{ status: string }>('/health', {
      method: 'GET',
    });
    const latency = Math.round(performance.now() - start);
    return {
      status: res.status === 'ok' ? 'healthy' : 'degraded',
      latencyMs: latency,
    };
  }
}

export const apiService = new ApiService();
