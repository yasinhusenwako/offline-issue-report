import React, { useState } from 'react';
import {
  Shield,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { ReportItem, ReportStatus } from '../../types';
import { PriorityBadge, StatusBadge, SyncBadge } from '../../components/ui/Badges';
import { formatDate } from '../../utils/formatters';
import { AssignReportModal } from '../../components/reports/AssignReportModal';
import { StatusChangeModal } from '../../components/reports/StatusChangeModal';
import { ReportDetailsDrawer } from '../../components/reports/ReportDetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { LikeButton } from '../../components/ui/LikeButton';
import { db } from '../../db';

export const ReportManagementPage: React.FC = () => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<ReportStatus | 'All'>('Submitted');
  const [search, setSearch] = useState('');
  const [assignTargetReport, setAssignTargetReport] = useState<ReportItem | null>(null);
  const [statusTargetReport, setStatusTargetReport] = useState<ReportItem | null>(null);
  const [drawerReport, setDrawerReport] = useState<ReportItem | null>(null);

  const { reports } = useReports({
    status: selectedStatusTab === 'All' ? 'all' : selectedStatusTab,
    search,
    includeDrafts: false,
  });

  const allReportsQuery = useReports({ includeDrafts: false });
  const allReports = allReportsQuery.reports;

  const countForStatus = (st: ReportStatus) => allReports.filter((r) => r.status === st).length;

  const tabs: { label: string; status: ReportStatus | 'All'; count: number }[] = [
    { label: 'New Submissions', status: 'Submitted', count: countForStatus('Submitted') },
    { label: 'Assigned', status: 'Assigned', count: countForStatus('Assigned') },
    { label: 'In Progress', status: 'In Progress', count: countForStatus('In Progress') },
    { label: 'Resolved', status: 'Resolved', count: countForStatus('Resolved') },
    { label: 'Rejected', status: 'Rejected', count: countForStatus('Rejected') },
    { label: 'All Active Tickets', status: 'All', count: allReports.length },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, status: ReportStatus | 'All') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedStatusTab(status);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent | React.KeyboardEvent, report: ReportItem) => {
    e.stopPropagation();
    const updated = !report.isFavorite;
    await db.reports.update(report.id, { isFavorite: updated });
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Coordinator Command
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
              {allReports.length} operational tickets
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Report Triage & Workflow Management
          </h1>
        </div>
      </div>

      {/* Workflow Tabs (Segmented Controls with keyboard accessibility) */}
      <div
        role="tablist"
        aria-label="Workflow Triage Stages"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((tab) => {
          const isActive = selectedStatusTab === tab.status;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelectedStatusTab(tab.status)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.status)}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none shrink-0 ${
                isActive
                  ? 'bg-indigo-900 dark:bg-indigo-600 text-white border-indigo-900 dark:border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold ${
                  isActive ? 'bg-indigo-800 dark:bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter triage queue by report ID, category, equipment, or address..."
          aria-label="Filter triage reports"
          className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg py-3 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white dark:bg-slate-900"
        />
      </div>

      {/* Reports Triage Cards */}
      {reports.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={`No reports currently in "${selectedStatusTab}" state`}
          description="The queue is clear for this stage. Select another workflow stage or review incoming field reports."
          actionText="View All Tickets"
          onAction={() => setSelectedStatusTab('All')}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{report.id}</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{report.category}</span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <PriorityBadge priority={report.priority} />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={report.status} />
                  <SyncBadge syncState={report.syncStatus} />
                  <LikeButton
                    isLiked={report.isFavorite}
                    onToggle={(e) => handleToggleFavorite(e, report)}
                    reportId={report.id}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{report.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{report.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>Location: <strong className="text-slate-900 dark:text-white">{report.location.address}</strong></span>
                  <span>Reported by: <strong className="text-slate-900 dark:text-white">{report.authorName}</strong></span>
                </div>

                <div className="font-mono text-slate-500 dark:text-slate-400 font-medium">
                  {formatDate(report.reportedAt)}
                </div>
              </div>

              {report.assignedTo && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs text-indigo-950 dark:text-indigo-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                    <span>Assigned Unit: <strong className="text-indigo-900 dark:text-indigo-100 font-bold">{report.assignedTo}</strong></span>
                  </div>
                  {report.assignedAt && (
                    <span className="text-[11px] font-mono text-indigo-800 dark:text-indigo-300">
                      Dispatched {formatDate(report.assignedAt)}
                    </span>
                  )}
                </div>
              )}

              {report.rejectionReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-950 dark:text-rose-200">
                  <strong className="text-rose-900 dark:text-rose-100">Rejection Note:</strong> {report.rejectionReason}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDrawerReport(report)}
                  className="min-h-[44px] px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  View Details & History
                </button>

                <button
                  type="button"
                  onClick={() => setAssignTargetReport(report)}
                  className="min-h-[44px] px-4 py-2 border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{report.assignedTo ? 'Reassign Crew' : 'Assign Crew'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusTargetReport(report)}
                  className="min-h-[44px] px-5 py-2 bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Advance Status</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-modals */}
      <AssignReportModal
        report={assignTargetReport}
        isOpen={!!assignTargetReport}
        onClose={() => setAssignTargetReport(null)}
      />

      <StatusChangeModal
        report={statusTargetReport}
        isOpen={!!statusTargetReport}
        onClose={() => setStatusTargetReport(null)}
      />

      <ReportDetailsDrawer
        report={drawerReport}
        isOpen={!!drawerReport}
        onClose={() => setDrawerReport(null)}
      />
    </div>
  );
};
