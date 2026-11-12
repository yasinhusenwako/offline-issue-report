import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncService } from '../services/syncService';

interface NetworkContextType {
  isOnline: boolean; // effective connectivity
  actualOnline: boolean;
  isSimulatingOffline: boolean;
  setSimulateOffline: (val: boolean) => void;
  toggleSimulateOffline: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actualOnline, setActualOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [isSimulatingOffline, setSimulateOfflineState] = useState(() => {
    try {
      const stored = localStorage.getItem('infrasync_mock_settings');
      if (stored) {
        return !!JSON.parse(stored).simulateOffline;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const setSimulateOffline = (val: boolean) => {
    setSimulateOfflineState(val);
    try {
      const stored = localStorage.getItem('infrasync_mock_settings');
      const settings = stored ? JSON.parse(stored) : {};
      settings.simulateOffline = val;
      localStorage.setItem('infrasync_mock_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  };

  const toggleSimulateOffline = () => {
    setSimulateOffline(!isSimulatingOffline);
  };

  useEffect(() => {
    const handleOnline = () => {
      setActualOnline(true);
      if (!isSimulatingOffline) {
        // Trigger auto-sync when network returns
        syncService.processQueue();
      }
    };

    const handleOffline = () => {
      setActualOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatingOffline]);

  // When simulated offline is toggled back to online, trigger queue
  useEffect(() => {
    if (!isSimulatingOffline && actualOnline) {
      syncService.processQueue();
    }
  }, [isSimulatingOffline, actualOnline]);

  const effectiveOnline = actualOnline && !isSimulatingOffline;

  return (
    <NetworkContext.Provider
      value={{
        isOnline: effectiveOnline,
        actualOnline,
        isSimulatingOffline,
        setSimulateOffline,
        toggleSimulateOffline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
