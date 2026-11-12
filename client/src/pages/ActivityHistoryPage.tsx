import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Users,
  RefreshCw,
  XCircle,
  X,
} from 'lucide-react';
import { useActivities } from '../hooks/useReports';
import { ActivityActionType } from '../types';
import { formatDate, formatTimeAgo } from '../utils/formatters';
import { EmptyState } from '../components/ui/EmptyState';

export const ActivityHistoryPage: React.FC = () => {
  const { activities, isLoading } = useActivities();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filtered = activities.filter((act) => {
    if (filterAction !== 'all' && act.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchReport = act.reportId.toLowerCase().includes(q);
      const matchTitle = act.reportTitle?.toLowerCase().includes(q) ?? false;
      const matchDesc = act.description.toLowerCase().includes(q);
      const matchUser = act.userName.toLowerCase().includes(q);
      return matchReport || matchTitle || matchDesc || matchUser;
    }
    return true;
  });

  const getActionIcon = (action: ActivityActionType) => {
    switch (action) {
      case 'report_created':
      case 'report_drafted':
        return <FileText className="w-4 h-4 text-slate-700" />;
      case 'report_submitted':
        return <CheckCircle2 className="w-4 h-4 text-blue-700" />;
      case 'report_synchronized':
        return <RefreshCw className="w-4 h-4 text-emerald-700" />;
      case 'sync_failed':
        return <AlertCircle className="w-4 h-4 text-red-700" />;
      case 'report_assigned':
        return <Users className="w-4 h-4 text-indigo-700" />;
      case 'status_changed':
        return <Clock className="w-4 h-4 text-amber-700" />;
      case 'report_resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'report_rejected':
        return <XCircle className="w-4 h-4 text-rose-700" />;
      default:
        return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionLabel = (action: ActivityActionType) => {
    switch (action) {
      case 'report_created':
        return 'Created';
      case 'report_drafted':
        return 'Draft Saved';
      case 'report_submitted':
        return 'Submitted';
      case 'report_synchronized':
        return 'Synchronized';
      case 'sync_failed':
        return 'Sync Failed';
      case 'report_assigned':
        return 'Assigned';
      case 'status_changed':
        return 'Status Updated';
      case 'report_resolved':
        return 'Resolved';
      case 'report_rejected':
        return 'Rejected';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Audit Trail
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
              {filtered.length} audit records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Activity & Dispatch History
          </h1>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter audit logs by report ID, staff name, or event description..."
              aria-label="Filter audit logs"
              className="min-h-[44px] w-full text-xs font-medium border border-slate-300 rounded-lg py-3 pl-10 pr-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="action-filter-select" className="sr-only">Filter by action</label>
            <select
              id="action-filter-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="min-h-[44px] text-xs font-semibold border border-slate-300 rounded-lg py-2.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Action Types</option>
              <option value="report_created">Report Created</option>
              <option value="report_drafted">Report Saved as Draft</option>
              <option value="report_submitted">Report Submitted</option>
              <option value="report_synchronized">Report Synchronized</option>
              <option value="sync_failed">Sync Failed</option>
              <option value="report_assigned">Report Assigned</option>
              <option value="status_changed">Status Changed</option>
              <option value="report_resolved">Report Resolved</option>
              <option value="report_rejected">Report Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity events found"
          description="We couldn't find any audit logs matching your search keyword or selected action filter."
          actionText="Clear Filter"
          onAction={() => {
            setSearch('');
            setFilterAction('all');
          }}
        />
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors text-xs"
            >
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                {getActionIcon(log.action)}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{log.userName}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-mono text-slate-700 font-bold">{log.reportId}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    {getActionLabel(log.action)}
                  </span>
                </div>

                {log.reportTitle && (
                  <p className="text-xs font-semibold text-slate-800 truncate">{log.reportTitle}</p>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>
              </div>

              <div className="text-right shrink-0 text-slate-500 font-mono text-[11px] space-y-0.5">
                <div className="font-semibold text-slate-700">{formatDate(log.timestamp)}</div>
                <div>{formatTimeAgo(log.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
