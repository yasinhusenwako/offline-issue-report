import React, { useState } from 'react';
import {
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Trash2,
  RotateCcw,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { useNetwork } from '../contexts/NetworkContext';
import { useSyncQueueItems } from '../hooks/useReports';
import { SyncBadge } from '../components/ui/Badges';
import { formatDate, formatTimeAgo } from '../utils/formatters';
import { syncService } from '../services/syncService';
import { EmptyState } from '../components/ui/EmptyState';

export const SyncPage: React.FC = () => {
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useNetwork();
  const { isSyncing, triggerSync, lastSyncTime, retryItem } = useSyncQueue();
  const { queueItems } = useSyncQueueItems();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const pendingItems = queueItems.filter((i) => i.status === 'Pending');
  const syncingItems = queueItems.filter((i) => i.status === 'Synchronizing');
  const failedItems = queueItems.filter((i) => i.status === 'Failed');

  const handleManualSyncAll = async () => {
    setSyncFeedback('Initiating synchronization with remote gateway...');
    const result = await triggerSync();
    if (result.processed === 0) {
      setSyncFeedback('Local queue is up to date.');
    } else {
      setSyncFeedback(
        `Sync batch complete: ${result.succeeded} succeeded, ${result.failed} failed.`
      );
    }
  };

  const handleRetryItem = async (queueId: string) => {
    setSyncFeedback('Retrying item transaction...');
    await retryItem(queueId);
  };

  const handleClearCompleted = async () => {
    await syncService.clearCompletedQueue();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-slide-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Offline Data Pipeline
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {queueItems.length} transactions queued
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Synchronization Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSimulateOffline}
            className={`min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isSimulatingOffline
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-950'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {isSimulatingOffline ? 'Exit Offline Simulation' : 'Simulate Offline State'}
          </button>

          <button
            onClick={handleManualSyncAll}
            disabled={isSyncing}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Queue...' : 'Sync All Pending'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-blue-50 border border-blue-200 text-blue-950 text-xs rounded-xl flex items-center justify-between font-medium shadow-xs"
        >
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-700 font-bold ml-2 hover:text-blue-900"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Connectivity & Sync Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Connectivity */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Network State
          </span>
          <div className="flex items-center gap-3 pt-1">
            {isOnline ? (
              <>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg shrink-0">
                  <Wifi className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-base font-bold text-emerald-900 dark:text-emerald-300 block leading-tight">Connected</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Gateway reachable</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg shrink-0">
                  <WifiOff className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-base font-bold text-amber-950 dark:text-amber-200 block leading-tight">
                    {isSimulatingOffline ? 'Simulated Offline' : 'Disconnected'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Queuing in IndexedDB</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pending Items Count */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Pending Queue
          </span>
          <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
            {pendingItems.length + syncingItems.length}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
            {syncingItems.length > 0 ? `${syncingItems.length} currently syncing` : 'Awaiting dispatch'}
          </span>
        </div>

        {/* Failed Sync Items */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Failed Transactions
          </span>
          <div className="text-3xl font-extrabold font-mono text-red-700 dark:text-red-400 tabular-nums">
            {failedItems.length}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
            {failedItems.length > 0 ? 'Retry individually or in bulk' : 'Zero failures in pipeline'}
          </span>
        </div>

        {/* Last Sync Timestamp */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Last Sync Time
          </span>
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white pt-1">
            {lastSyncTime ? formatDate(lastSyncTime) : 'Never synced'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
            {lastSyncTime ? formatTimeAgo(lastSyncTime) : 'Initial setup'}
          </span>
        </div>
      </div>

      {/* Synchronization Engine Explanation */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3 transition-colors">
        <Database className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">
            Offline Resilient Architecture (Dexie IndexedDB + Background Pipeline)
          </span>
          <p>
            When field technicians create reports or coordinators adjust workflow statuses in areas with zero cell service,
            changes are committed locally first with full ACID guarantees. If transmission fails, the sync engine retains the payload,
            increments the attempt counter, and retries automatically when connection returns.
          </p>
        </div>
      </div>

      {/* Queue Items Table / List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Queued Transactions ({queueItems.length})</h2>
          {queueItems.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white underline px-2 py-1 transition-colors"
            >
              Clear Completed
            </button>
          )}
        </div>

        {queueItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Local Synchronization Queue Is Empty"
            description="All local reports and state changes have been successfully committed and synchronized with the remote backend."
          />
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{item.reportId}</span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                      Action: {item.action}
                    </span>
                    <SyncBadge syncState={item.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {item.payload.title || 'Report modification'}
                  </h3>
                  {item.errorMessage && (
                    <p className="text-xs text-red-700 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900">
                      Error: {item.errorMessage}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-4 flex-wrap">
                    <span>Enqueued: {formatDate(item.createdAt)}</span>
                    <span>Attempts: {item.attempts}/{item.maxAttempts}</span>
                    {item.lastAttemptAt && (
                      <span>Last attempt: {formatTimeAgo(item.lastAttemptAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'Failed' && (
                    <button
                      onClick={() => handleRetryItem(item.id)}
                      className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry Transaction</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
