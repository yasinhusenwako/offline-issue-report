import React, { useState, useEffect } from 'react';
import { Server, Zap, X, Clock } from 'lucide-react';
import { useNetwork } from '../../contexts/NetworkContext';

export const ServerWakingBanner: React.FC = () => {
  const { isOnline } = useNetwork();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('infrasync_mock_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Show if latency is simulated as high server warm-up (>= 1500ms)
        if (parsed.mockNetworkLatencyMs >= 1500 && isOnline && !dismissed) {
          setIsVisible(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setIsVisible(false);
  }, [isOnline, dismissed]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-indigo-950 text-indigo-100 border-b border-indigo-800 px-4 py-2.5 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded bg-indigo-800/80 text-indigo-300 shrink-0">
            <Server className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <div>
            <span className="font-semibold text-white">Cloud Gateway Waking Up</span>
            <span className="hidden sm:inline text-indigo-300"> — </span>
            <span className="text-indigo-200">
              Backend instance is spinning up after scale-to-zero. Local IndexedDB is active; requests will sync automatically once warm.
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setDismissed(true);
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-indigo-300 hover:text-white p-1 rounded-md hover:bg-indigo-900 transition-colors shrink-0"
          aria-label="Dismiss server waking banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
