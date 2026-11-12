import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useNetwork();
  const { pendingCount, triggerSync, isSyncing } = useSyncQueue();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
        <div className="flex items-center gap-2 font-bold flex-wrap">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" aria-hidden="true" />
          <span>
            {isSimulatingOffline
              ? 'Simulated Field Offline Mode is ACTIVE'
              : 'Offline Mode: No Internet Connection Detected'}
          </span>
          <span className="hidden md:inline text-amber-950" aria-hidden="true">·</span>
          <span className="text-amber-950 font-semibold">
            {pendingCount > 0
              ? `${pendingCount} report${pendingCount > 1 ? 's' : ''} stored locally in Dexie IndexedDB`
              : 'All operations persist locally and will auto-sync upon reconnection'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSimulatingOffline && (
            <button
              onClick={toggleSimulateOffline}
              className="min-h-[44px] px-3 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Resume Online
            </button>
          )}

          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-lg font-bold text-xs hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
