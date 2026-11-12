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
      text: 'text-red-900 font-bold',
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-700 shrink-0" aria-hidden="true" />,
    },
    High: {
      text: 'text-amber-900 font-bold',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />,
    },
    Medium: {
      text: 'text-blue-900 font-bold',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: <Minus className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />,
    },
    Low: {
      text: 'text-slate-800 font-semibold',
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      icon: <ArrowDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
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
      text: 'text-slate-800 font-semibold',
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      icon: <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />,
    },
    Submitted: {
      text: 'text-blue-900 font-bold',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />,
    },
    Assigned: {
      text: 'text-indigo-900 font-bold',
      bg: 'bg-indigo-50',
      border: 'border-indigo-300',
      icon: <Clock className="w-3.5 h-3.5 text-indigo-700 shrink-0" aria-hidden="true" />,
    },
    'In Progress': {
      text: 'text-amber-900 font-bold',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />,
    },
    Resolved: {
      text: 'text-emerald-900 font-bold',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />,
    },
    Rejected: {
      text: 'text-rose-900 font-bold',
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" aria-hidden="true" />,
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
      text: 'text-emerald-900 font-bold',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />,
    },
    Synchronizing: {
      text: 'text-blue-900 font-bold',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: <RefreshCw className="w-3.5 h-3.5 text-blue-700 shrink-0 animate-spin" aria-hidden="true" />,
    },
    Pending: {
      text: 'text-amber-900 font-bold',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />,
    },
    Failed: {
      text: 'text-red-900 font-bold',
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0" aria-hidden="true" />,
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
