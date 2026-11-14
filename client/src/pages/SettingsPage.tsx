import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Wifi,
  WifiOff,
  User,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Download,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import { db, initializeDatabase } from '../db';
import { useReports, useSyncQueueItems, useActivities } from '../hooks/useReports';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const SettingsPage: React.FC = () => {
  const { role, userName, userId } = useAuth();
  const { isOnline, isSimulatingOffline, setSimulateOffline } = useNetwork();
  const { reports } = useReports();
  const { queueItems } = useSyncQueueItems();
  const { activities } = useActivities();

  const [mockLatency, setMockLatency] = useState(600);
  const [failureRate, setFailureRate] = useState(15);
  const [autoSync, setAutoSync] = useState(true);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('infrasync_mock_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.mockNetworkLatencyMs !== undefined) setMockLatency(parsed.mockNetworkLatencyMs);
        if (parsed.simulateFailureRatePercent !== undefined) setFailureRate(parsed.simulateFailureRatePercent);
        if (parsed.autoSyncEnabled !== undefined) setAutoSync(parsed.autoSyncEnabled);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSettings = () => {
    const settings = {
      mockNetworkLatencyMs: mockLatency,
      simulateOffline: isSimulatingOffline,
      simulateFailureRatePercent: failureRate,
      autoSyncEnabled: autoSync,
    };
    localStorage.setItem('infrasync_mock_settings', JSON.stringify(settings));
    setSaveNotification('Terminal preferences saved to local browser storage.');
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleResetDatabase = async () => {
    if (confirm('Reset IndexedDB database to initial seed data? This will clear all temporary test entries.')) {
      await db.reports.clear();
      await db.syncQueue.clear();
      await db.activities.clear();
      await initializeDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Terminal Preferences
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System Settings & Simulation Engine
          </h1>
        </div>

        <button
          onClick={handleSaveSettings}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveNotification && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2.5 font-medium shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Appearance & Theme Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Appearance & Color Scheme</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Select your visual preference. Light mode for high daylight field operations, Dark mode for night operations or low-light battery saving, or System to follow OS.
            </p>
          </div>
          <ThemeToggle variant="segmented" />
        </div>
      </div>

      {/* Role & Staff Identity Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Active Field Identity</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Staff Name</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{userName}</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Terminal ID</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{userId}</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Operating Mode</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase text-xs">
                {role.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Managed via Supabase Auth
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline & Synchronization Testing Environment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Network Simulation & Resilience Controls</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          Tune latency and network drops to evaluate how the offline queue and background retry behavior perform in zero-connectivity tunnels or remote utility sectors.
        </p>

        <div className="space-y-4 pt-2">
          {/* Simulated Offline Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">
                Simulate Field Offline Disconnection
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Forces all outgoing API synchronization to queue into Dexie IndexedDB
              </span>
            </div>
            <button
              onClick={() => setSimulateOffline(!isSimulatingOffline)}
              className={`min-h-[44px] px-5 py-2 rounded-lg text-xs font-bold transition-colors border cursor-pointer shrink-0 ${
                isSimulatingOffline
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {isSimulatingOffline ? 'Offline Active' : 'Online'}
            </button>
          </div>

          {/* Network Latency Slider */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="latency-slider" className="font-bold text-slate-800 dark:text-slate-200">
                Simulated Backend Latency: <span className="font-mono text-blue-700 dark:text-blue-400">{mockLatency}ms</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Satellite uplink delay</span>
            </div>
            <input
              id="latency-slider"
              type="range"
              min="100"
              max="3000"
              step="100"
              value={mockLatency}
              onChange={(e) => setMockLatency(Number(e.target.value))}
              className="w-full accent-[#163A5F] dark:accent-blue-500 cursor-pointer min-h-[32px]"
            />
          </div>

          {/* Simulated Failure Rate Slider */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="failure-slider" className="font-bold text-slate-800 dark:text-slate-200">
                Simulated Gateway Error Rate: <span className="font-mono text-red-700 dark:text-red-400">{failureRate}%</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tests automatic retry</span>
            </div>
            <input
              id="failure-slider"
              type="range"
              min="0"
              max="50"
              step="5"
              value={failureRate}
              onChange={(e) => setFailureRate(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer min-h-[32px]"
            />
          </div>
        </div>
      </div>

      {/* Local IndexedDB Health & Storage */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Local IndexedDB Persistence (Dexie.js)</span>
          </h2>
          <button
            onClick={handleResetDatabase}
            className="min-h-[44px] flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 font-bold underline px-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database to Seed</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Local Reports</span>
            <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">{reports.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1">Full record snapshots</span>
          </div>

          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Queued Transactions</span>
            <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">{queueItems.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1">In syncQueue table</span>
          </div>

          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Audit Events Stored</span>
            <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">{activities.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1">Immutable activity log</span>
          </div>
        </div>
      </div>
    </div>
  );
};
