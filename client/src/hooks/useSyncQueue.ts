import { useEffect, useState } from 'react';
import { syncService } from '../services/syncService';

export function useSyncQueue() {
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: string | null;
  }>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: syncService.getLastSyncTime(),
  });

  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });

    // Initial check
    syncService.getPendingCount().then((count) => {
      setSyncState((prev) => ({ ...prev, pendingCount: count }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerSync = async () => {
    const res = await syncService.processQueue(true);
    await syncService.pullFromServer();
    return res;
  };

  const retryItem = async (queueItemId: string) => {
    return await syncService.retryItem(queueItemId);
  };

  return {
    ...syncState,
    triggerSync,
    retryItem,
  };
}
