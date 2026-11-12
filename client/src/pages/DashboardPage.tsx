import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  HardHat,
  Database,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useReports } from '../hooks/useReports';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { PriorityBadge, StatusBadge, SyncBadge } from '../components/ui/Badges';
import { formatDate } from '../utils/formatters';
import { ReportDetailsDrawer } from '../components/reports/ReportDetailsDrawer';
import { ReportItem } from '../types';
import { useCountUp } from '../hooks/useCountUp';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { LikeButton } from '../components/ui/LikeButton';
import { db } from '../db';

export const DashboardPage: React.FC = () => {
  const { role, userName } = useAuth();
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useNetwork();
  const { pendingCount, isSyncing, triggerSync } = useSyncQueue();
  const { reports, isLoading } = useReports();
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Metrics computation
  const totalReportsCount = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'Submitted').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const assignedCount = reports.filter((r) => r.status === 'Assigned').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const rejectedCount = reports.filter((r) => r.status === 'Rejected').length;
  const draftCount = reports.filter((r) => r.isDraft).length;
  const failedSyncCount = reports.filter((r) => r.syncStatus === 'Failed').length;

  // Count up micro-interactions
  const animTotal = useCountUp(totalReportsCount);
  const animSubmitted = useCountUp(submittedCount);
  const animPending = useCountUp(pendingCount);
  const animFailed = useCountUp(failedSyncCount);
  const animResolved = useCountUp(resolvedCount);
  const animAssigned = useCountUp(assignedCount);
  const animInProgress = useCountUp(inProgressCount);
  const animRejected = useCountUp(rejectedCount);

  const criticalIssues = reports.filter(
    (r) => r.priority === 'Critical' && r.status !== 'Resolved' && r.status !== 'Rejected'
  );

  const recentReports = reports.slice(0, 5);

  const handleToggleFavorite = async (e: React.MouseEvent | React.KeyboardEvent, report: ReportItem) => {
    e.stopPropagation();
    const updated = !report.isFavorite;
    await db.reports.update(report.id, { isFavorite: updated });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-slide-up">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {role === 'field_worker' ? 'Field Station Terminal' : 'Operations Coordination Center'}
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
              {animTotal} records stored locally
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {userName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-700' : 'text-slate-600'}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
          </button>

          <Link
            to="/reports/new"
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#163A5F] hover:bg-[#1E4B7A] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Report</span>
          </Link>
        </div>
      </div>

      {/* Critical Safety Notice if critical issues exist */}
      {criticalIssues.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-950">
                Critical Infrastructure Alerts ({criticalIssues.length})
              </h2>
              <p className="text-xs text-red-900 mt-1 leading-relaxed">
                Active high-risk hazards require urgent coordination:{' '}
                <span className="font-semibold text-red-950">
                  {criticalIssues.map((c) => c.title).join('; ')}
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/reports?priority=Critical"
            className="min-h-[44px] inline-flex items-center text-xs font-bold text-red-900 hover:text-red-950 underline whitespace-nowrap shrink-0 px-2 py-1"
          >
            Inspect Critical Tickets →
          </Link>
        </div>
      )}

      {/* Primary KPI Hero Stat Tiles:
          Stacks neatly:
          - 375px: 1 column
          - 768px: 2/3 columns
          - 1280px desktop: 5/6 columns
      */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
      ) : role === 'field_worker' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Created</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {animTotal}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 font-medium">
              {draftCount} local drafts saved
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Submitted</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-blue-700 tabular-nums">
              {animSubmitted}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 font-medium">Ready for dispatch</div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pending Sync</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-800 tabular-nums">
              {animPending}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 font-medium">Queued in IndexedDB</div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Failed Sync</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-red-700 tabular-nums">
              {animFailed}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 font-medium">
              {failedSyncCount > 0 ? (
                <Link to="/sync" className="text-red-700 underline font-semibold">
                  Review & retry queue
                </Link>
              ) : (
                'Zero network errors'
              )}
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-800 tabular-nums">
              {animResolved}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 font-medium">Repairs completed</div>
          </div>
        </div>
      ) : (
        /* Coordinator Hero Stat Tiles */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Total Reports</span>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {animTotal}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">All logged tickets</span>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block mb-1">New Submissions</span>
            <div className="text-3xl font-extrabold font-mono text-blue-700 tabular-nums">
              {animSubmitted}
            </div>
            <span className="text-[11px] text-blue-800 font-semibold">Needs assignment</span>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">Assigned</span>
            <div className="text-3xl font-extrabold font-mono text-indigo-700 tabular-nums">
              {animAssigned}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">With field crews</span>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">In Progress</span>
            <div className="text-3xl font-extrabold font-mono text-amber-800 tabular-nums">
              {animInProgress}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">Active repairs</span>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">Resolved</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-800 tabular-nums">
              {animResolved}
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold">Audited & closed</span>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900 block mb-1">Rejected</span>
            <div className="text-3xl font-extrabold font-mono text-rose-700 tabular-nums">
              {animRejected}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">With audit reasons</span>
          </div>
        </div>
      )}

      {/* Offline Status & Field Resilience Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#163A5F] to-[#1E4B7A] text-white rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-1 bg-blue-500/30 border border-blue-400/40 rounded-md text-[11px] font-mono uppercase tracking-wider text-blue-100 font-bold">
              Dexie.js IndexedDB Engine
            </span>
            <span className="text-xs text-blue-200" aria-hidden="true">·</span>
            <span className="text-xs text-blue-100 font-semibold">
              {isOnline ? 'Online Sync Active' : 'Offline Mode Active'}
            </span>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
            All field reports, draft forms, and technician assignments persist locally without requiring constant network reception.
            Changes sync automatically when connectivity is established.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleSimulateOffline}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
              isSimulatingOffline
                ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
            }`}
          >
            {isSimulatingOffline ? 'Exit Offline Simulation' : 'Simulate Offline Field'}
          </button>
          <Link
            to="/sync"
            className="min-h-[44px] inline-flex items-center px-4 py-2 bg-white text-[#163A5F] hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            View Sync Queue
          </Link>
        </div>
      </div>

      {/* Recent Infrastructure Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Infrastructure Reports</h2>
            <p className="text-xs text-slate-600">Latest field reports captured on this station</p>
          </div>
          <Link
            to="/reports"
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 px-2 py-1"
          >
            <span>View All ({reports.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-3">
            <p className="text-xs text-slate-600 font-medium">No reports recorded in local database yet.</p>
            <Link
              to="/reports/new"
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-[#163A5F] text-white rounded-lg text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Report</span>
            </Link>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-700">{report.id}</span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-slate-800">{report.category}</span>
                    {report.isDraft && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-bold">
                        Draft
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-600 truncate">{report.location.address}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <PriorityBadge priority={report.priority} />
                  <StatusBadge status={report.status} />
                  <SyncBadge syncState={report.syncStatus} />
                  <span className="text-slate-600 font-mono text-[11px] hidden md:inline">
                    {formatDate(report.reportedAt)}
                  </span>
                  <LikeButton
                    isLiked={report.isFavorite}
                    onToggle={(e) => handleToggleFavorite(e, report)}
                    reportId={report.id}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Slide-over Drawer / Bottom Sheet */}
      <ReportDetailsDrawer
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
