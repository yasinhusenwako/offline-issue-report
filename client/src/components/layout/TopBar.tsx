import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, RefreshCw, Shield, HardHat, Layers, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { ThemeToggle } from '../ui/ThemeToggle';

export const TopBar: React.FC<{ onMobileMenuToggle: () => void }> = ({ onMobileMenuToggle }) => {
  const { role, userName, signOut } = useAuth();
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useNetwork();
  const { pendingCount, isSyncing } = useSyncQueue();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Determine breadcrumb title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
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
      case '/admin/users':
        return 'User & Role Administration';
      case '/settings':
        return 'System Settings';
      default:
        if (location.pathname.startsWith('/reports/')) return 'Report Details';
        return 'InfraSync';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Zone 1 & 2: Mobile toggle + Breadcrumb trail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Layers className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          <Link to="/" className="hidden sm:inline text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold">
            InfraSync
          </Link>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">{getPageTitle()}</span>
        </nav>
      </div>

      {/* Zone 3: Primary Status Controls, Connection, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Simulation / Real Connection Status */}
        <button
          onClick={toggleSimulateOffline}
          className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/60'
          }`}
          aria-label={isSimulatingOffline ? 'Disable simulated offline mode' : 'Simulate offline mode'}
          title={isSimulatingOffline ? 'Click to disable offline simulation' : 'Click to simulate offline field disconnection'}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          )}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          {isSimulatingOffline && (
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1 py-0.2 rounded font-bold text-amber-950 dark:text-amber-200">
              SIM
            </span>
          )}
        </button>

        {/* Sync Queue Action Indicator */}
        <Link
          to="/sync"
          className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            pendingCount > 0
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/60'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label={`${pendingCount} reports queued for synchronization`}
          title={`${pendingCount} reports pending sync`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} />
          <span className="tabular-nums font-mono font-bold text-slate-900 dark:text-white">{pendingCount}</span>
          <span className="hidden md:inline font-medium">in queue</span>
        </Link>

        {/* Dark Mode Toggle */}
        <ThemeToggle />

        {/* User Account / Role dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            aria-label="User Account Menu"
          >
            {role === 'admin' ? (
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : role === 'coordinator' ? (
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden md:inline truncate max-w-[130px]">{userName}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                role === 'admin'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200'
                  : role === 'coordinator'
                  ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200'
              }`}
            >
              {role === 'field_worker' ? 'Field' : role}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white truncate">{userName}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{role.replace('_', ' ')}</div>
              </div>

              {role === 'admin' && (
                <Link
                  to="/admin/users"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>User Management</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* PWA Install Button */}
        <div className="hidden sm:block">
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
