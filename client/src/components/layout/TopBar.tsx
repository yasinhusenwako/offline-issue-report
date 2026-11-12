import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Wifi, WifiOff, RefreshCw, Shield, HardHat, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { PWAInstallButton } from '../ui/PWAInstallButton';

export const TopBar: React.FC<{ onMobileMenuToggle: () => void }> = ({ onMobileMenuToggle }) => {
  const { role, switchRole, userName } = useAuth();
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useNetwork();
  const { pendingCount, isSyncing } = useSyncQueue();
  const location = useLocation();

  // Determine breadcrumb title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'System Overview';
      case '/reports':
        return 'Infrastructure Reports';
      case '/reports/new':
        return 'New Report Entry';
      case '/sync':
        return 'Offline Sync Queue';
      case '/activity':
        return 'Audit & Activity Log';
      case '/management':
        return 'Coordinator Report Triage';
      case '/maintenance':
        return 'Maintenance Scheduling';
      case '/settings':
        return 'System Settings';
      default:
        if (location.pathname.startsWith('/reports/')) return 'Report Details';
        return 'InfraSync';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Zone 1 & 2: Mobile toggle + Breadcrumb trail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Layers className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline text-slate-600 font-semibold">InfraSync</span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">/</span>
          <span className="font-bold text-slate-900 tracking-tight">{getPageTitle()}</span>
        </nav>
      </div>

      {/* Zone 3: Primary Status Controls, Connection, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Simulation / Real Connection Status */}
        <button
          onClick={toggleSimulateOffline}
          className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
          }`}
          aria-label={isSimulatingOffline ? 'Disable simulated offline mode' : 'Simulate offline mode'}
          title={isSimulatingOffline ? 'Click to disable offline simulation' : 'Click to simulate offline field disconnection'}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-700" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-700" />
          )}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          {isSimulatingOffline && (
            <span className="text-[10px] bg-amber-200 px-1 py-0.2 rounded font-bold text-amber-950">
              SIM
            </span>
          )}
        </button>

        {/* Sync Queue Action Indicator */}
        <Link
          to="/sync"
          className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            pendingCount > 0
              ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
          aria-label={`${pendingCount} reports queued for synchronization`}
          title={`${pendingCount} reports pending sync`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-700' : 'text-slate-600'}`} />
          <span className="tabular-nums font-mono font-bold text-slate-900">{pendingCount}</span>
          <span className="hidden md:inline font-medium">in queue</span>
        </Link>

        {/* User Role Switcher for Development / Field Testing */}
        <button
          onClick={switchRole}
          className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          title={`Currently logged in as ${userName}. Click to switch role.`}
          aria-label={`Switch role from ${role === 'field_worker' ? 'Field Worker' : 'Coordinator'}`}
        >
          {role === 'field_worker' ? (
            <HardHat className="w-4 h-4 text-amber-600" />
          ) : (
            <Shield className="w-4 h-4 text-indigo-600" />
          )}
          <span className="hidden lg:inline">{role === 'field_worker' ? 'Field Worker' : 'Coordinator'}</span>
          <span className="text-[11px] text-blue-700 underline font-medium">Switch</span>
        </button>

        {/* PWA Install Button */}
        <div className="hidden sm:block">
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
