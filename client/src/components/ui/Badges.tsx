import React from 'react';
import { PriorityLevel, ReportStatus, SyncState } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertOctagon,
} from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const configs: Record<
    PriorityLevel,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    Critical: {
      text: 'text-red-900 dark:text-red-200 font-bold',
      bg: 'bg-red-50 dark:bg-red-950/60',
      border: 'border-red-300 dark:border-red-900',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-700 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    High: {
      text: 'text-amber-900 dark:text-amber-200 font-bold',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-300 dark:border-amber-900',
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    },
    Medium: {
      text: 'text-blue-900 dark:text-blue-200 font-bold',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-300 dark:border-blue-900',
      icon: <Minus className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" aria-hidden="true" />,
    },
    Low: {
      text: 'text-slate-800 dark:text-slate-200 font-semibold',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-300 dark:border-slate-700',
      icon: <ArrowDownRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" aria-hidden="true" />,
    },
  };

  const c = configs[priority] || configs.Low;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.icon}
      <span>{priority}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const configs: Record<
    ReportStatus,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    Draft: {
      text: 'text-slate-800 dark:text-slate-200 font-semibold',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-300 dark:border-slate-700',
      icon: <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" aria-hidden="true" />,
    },
    Submitted: {
      text: 'text-blue-900 dark:text-blue-200 font-bold',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-300 dark:border-blue-900',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" aria-hidden="true" />,
    },
    Assigned: {
      text: 'text-indigo-900 dark:text-indigo-200 font-bold',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-300 dark:border-indigo-900',
      icon: <Clock className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400 shrink-0" aria-hidden="true" />,
    },
    'In Progress': {
      text: 'text-amber-900 dark:text-amber-200 font-bold',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-300 dark:border-amber-900',
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    },
    Resolved: {
      text: 'text-emerald-900 dark:text-emerald-200 font-bold',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-300 dark:border-emerald-900',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />,
    },
    Rejected: {
      text: 'text-rose-900 dark:text-rose-200 font-bold',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-300 dark:border-rose-900',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />,
    },
  };

  const c = configs[status] || configs.Draft;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.icon}
      <span>{status}</span>
    </span>
  );
};

export const SyncBadge: React.FC<{ syncState: SyncState; showLabel?: boolean }> = ({
  syncState,
  showLabel = true,
}) => {
  const configs: Record<
    SyncState,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    Synchronized: {
      text: 'text-emerald-900 dark:text-emerald-200 font-bold',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-300 dark:border-emerald-900',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />,
    },
    Synchronizing: {
      text: 'text-blue-900 dark:text-blue-200 font-bold',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-300 dark:border-blue-900',
      icon: <RefreshCw className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0 animate-spin" aria-hidden="true" />,
    },
    Pending: {
      text: 'text-amber-900 dark:text-amber-200 font-bold',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-300 dark:border-amber-900',
      icon: <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    },
    Failed: {
      text: 'text-red-900 dark:text-red-200 font-bold',
      bg: 'bg-red-50 dark:bg-red-950/60',
      border: 'border-red-300 dark:border-red-900',
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-700 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    Conflict: {
      text: 'text-orange-900 dark:text-orange-200 font-bold',
      bg: 'bg-orange-50 dark:bg-orange-950/60',
      border: 'border-orange-400 dark:border-orange-900',
      icon: <AlertCircle className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400 shrink-0" aria-hidden="true" />,
    },
  };

  const c = configs[syncState] || configs.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs border ${c.bg} ${c.text} ${c.border}`}
      title={`Synchronization state: ${syncState}`}
    >
      {c.icon}
      {showLabel && <span>{syncState}</span>}
    </span>
  );
};
