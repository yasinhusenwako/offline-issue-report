import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  RefreshCw,
  History,
  Settings,
  CheckSquare,
  Wrench,
  Shield,
  HardHat,
  Database,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { PWAInstallButton } from '../ui/PWAInstallButton';

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { role, userName, userId, department, signOut } = useAuth();
  const { pendingCount } = useSyncQueue();
  const navigate = useNavigate();

  const standardNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Reports', path: '/reports', icon: FileText },
    { label: 'Create Report', path: '/reports/new', icon: PlusCircle, highlight: true },
    {
      label: 'Pending Sync',
      path: '/sync',
      icon: RefreshCw,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { label: 'Activity History', path: '/activity', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const coordinatorNav = [
    { label: 'Report Management', path: '/management', icon: CheckSquare },
    { label: 'Maintenance Overview', path: '/maintenance', icon: Wrench },
  ];

  const adminNav = [
    { label: 'User & Role Access', path: '/admin/users', icon: Users },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <aside
      aria-label="Main Navigation"
      className="w-64 bg-[#163A5F] dark:bg-slate-900 text-slate-100 flex flex-col h-full border-r border-[#1E4B7A]/60 dark:border-slate-800 select-none"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-500/25 border border-blue-400/40 flex items-center justify-center text-blue-200">
          <Database className="w-5 h-5 text-blue-300" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block leading-none">
            InfraSync
          </span>
          <span className="text-[10px] text-blue-200 font-mono tracking-wider uppercase block mt-1 font-semibold">
            Field Mesh System
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Core Field Operations */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Operations
          </div>
          <nav aria-label="Operational links" className="space-y-1">
            {standardNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  } ${item.highlight ? 'border border-blue-400/40 bg-blue-500/15' : ''}`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon className="w-4 h-4 shrink-0 text-slate-200" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded tabular-nums">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Coordinator Specific Workflows */}
        {(role === 'coordinator' || role === 'admin') && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              <span>Coordination</span>
              <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-100 text-[10px] px-1.5 py-0.2 rounded font-bold">
                Lead
              </span>
            </div>
            <nav aria-label="Coordinator links" className="space-y-1">
              {coordinatorNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 text-slate-200" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Admin Specific Workflows */}
        {role === 'admin' && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-200">
              <span>Administration</span>
              <span className="bg-purple-500/30 border border-purple-400/40 text-purple-100 text-[10px] px-1.5 py-0.2 rounded font-bold">
                Admin
              </span>
            </div>
            <nav aria-label="Administrator links" className="space-y-1">
              {adminNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 text-slate-200" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Quick Resilience info for Field Workers */}
        <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-200">
          <div className="flex items-center gap-2 text-blue-200 font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Offline Guaranteed</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            All records persist directly on this device in Dexie IndexedDB.
          </p>
        </div>

        <div className="px-1">
          <PWAInstallButton variant="full" />
        </div>
      </div>

      {/* User Role Card & Footer */}
      <div className="p-3.5 border-t border-white/10 dark:border-slate-800 bg-[#0F2844] dark:bg-slate-950/80 shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shrink-0">
            {role === 'admin' ? (
              <Shield className="w-4 h-4 text-purple-300" />
            ) : role === 'coordinator' ? (
              <Shield className="w-4 h-4 text-indigo-300" />
            ) : (
              <HardHat className="w-4 h-4 text-amber-300" />
            )}
          </div>
          <div className="truncate min-w-0">
            <span className="text-xs font-bold text-white truncate block">{userName}</span>
            <span className="text-[11px] text-slate-300 font-mono truncate block font-medium capitalize">
              {role.replace('_', ' ')} &middot; {userId}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="min-h-[40px] w-full flex items-center justify-center gap-2 text-center text-xs font-semibold py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-200 text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
