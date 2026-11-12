import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wrench,
  RefreshCw,
  FileEdit,
} from 'lucide-react';
import { ReportItem } from '../../types';
import { PriorityBadge, StatusBadge, SyncBadge } from '../ui/Badges';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useActivities } from '../../hooks/useReports';
import { AssignReportModal } from './AssignReportModal';
import { StatusChangeModal } from './StatusChangeModal';
import { syncService } from '../../services/syncService';
import { db } from '../../db';
import { LikeButton } from '../ui/LikeButton';
import { Link } from 'react-router-dom';

interface ReportDetailsDrawerProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ReportDetailsDrawer: React.FC<ReportDetailsDrawerProps> = ({
  report,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { role } = useAuth();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { activities } = useActivities(report?.id);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Esc key and focus trap management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        // Focus trap
        if (e.key === 'Tab' && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus first element in drawer
      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const handleManualSync = async () => {
    await syncService.enqueue(report, 'update');
    if (onRefresh) onRefresh();
  };

  const handleToggleFavorite = async () => {
    const updated = !report.isFavorite;
    await db.reports.update(report.id, { isFavorite: updated });
    report.isFavorite = updated;
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end md:items-stretch md:justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Soft Backdrop fade */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Responsive Container: Bottom Sheet on Mobile (< md), Slide Drawer on Desktop (md+) */}
        <div
          ref={drawerRef}
          className="relative w-full md:max-w-xl bg-white max-h-[90vh] md:max-h-full md:h-full rounded-t-2xl md:rounded-none shadow-2xl flex flex-col z-10 border-t md:border-t-0 md:border-l border-slate-200 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="md:hidden pt-3 pb-1 flex justify-center bg-slate-50/70 border-b border-slate-100">
            <div className="w-12 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/50 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-semibold text-slate-700">{report.id}</span>
                <SyncBadge syncState={report.syncStatus} />
                {report.isDraft && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </div>
              <h2 id="drawer-title" className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {report.title}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <LikeButton
                isLiked={report.isFavorite}
                onToggle={handleToggleFavorite}
                reportId={report.id}
                size="sm"
              />
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close report details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-700">
            {/* Quick Status and Priority Matrix */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-[11px] text-slate-600 font-semibold block mb-1">Workflow Status</span>
                <StatusBadge status={report.status} />
              </div>
              <div>
                <span className="text-[11px] text-slate-600 font-semibold block mb-1">Priority Level</span>
                <PriorityBadge priority={report.priority} />
              </div>
            </div>

            {/* Rejection Alert if rejected */}
            {report.status === 'Rejected' && report.rejectionReason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-950 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Rejection Reason</span>
                </div>
                <p className="text-xs leading-relaxed text-rose-900">{report.rejectionReason}</p>
              </div>
            )}

            {/* Resolution Alert if resolved */}
            {report.status === 'Resolved' && report.resolutionNotes && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Maintenance Resolution Summary</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-900">{report.resolutionNotes}</p>
                {report.resolvedAt && (
                  <span className="text-[11px] text-emerald-800 mt-2 block font-mono">
                    Completed at: {formatDate(report.resolvedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Issue Description
              </h3>
              <div className="p-4 bg-white border border-slate-200 rounded-lg leading-relaxed whitespace-pre-wrap text-slate-800">
                {report.description}
              </div>
            </div>

            {/* Location & GPS Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Location & Coordinates
              </h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900">{report.location.address}</span>
                </div>
                {report.location.latitude && report.location.longitude && (
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-600 pt-2 border-t border-slate-200">
                    <span>Lat: {report.location.latitude.toFixed(5)}</span>
                    <span>Lon: {report.location.longitude.toFixed(5)}</span>
                    {report.location.accuracyMeters && (
                      <span>±{report.location.accuracyMeters}m</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Team & Dispatch Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Operational Assignment
              </h3>
              <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">
                    {report.assignedTo || 'Unassigned — Awaiting Coordinator Dispatch'}
                  </span>
                </div>
                {role === 'coordinator' && (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-blue-700 hover:text-blue-900 font-semibold underline px-2 py-1"
                  >
                    {report.assignedTo ? 'Reassign' : 'Assign Crew'}
                  </button>
                )}
              </div>
            </div>

            {/* Report Metadata Details */}
            <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Reported By</span>
                <span className="font-semibold text-slate-900">
                  {report.authorName} ({report.authorId})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Category</span>
                <span className="font-semibold text-slate-900">{report.category}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Report Date</span>
                <span className="font-mono text-slate-800">{formatDate(report.reportedAt)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Last Modified</span>
                <span className="font-mono text-slate-800">{formatDate(report.updatedAt)}</span>
              </div>
              {report.syncError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <span className="font-bold block mb-0.5">Sync Error:</span>
                  <span>{report.syncError}</span>
                </div>
              )}
            </div>

            {/* Item Activity Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Activity Audit Trail
              </h3>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No activity entries recorded yet.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="relative pl-4 pb-2 border-l border-slate-200">
                      <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{act.userName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDate(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            {report.syncStatus === 'Failed' && (
              <button
                onClick={handleManualSync}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Sync</span>
              </button>
            )}

            {report.isDraft && (
              <Link
                to={`/reports/new?draftId=${report.id}`}
                className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <FileEdit className="w-4 h-4" />
                <span>Continue Editing Draft</span>
              </Link>
            )}

            {role === 'coordinator' && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="min-h-[44px] px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Assign Crew
                </button>
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="min-h-[44px] px-4 py-2 bg-[#163A5F] hover:bg-[#1E4B7A] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Change Status
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <AssignReportModal
        report={report}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={onRefresh}
      />

      <StatusChangeModal
        report={report}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={onRefresh}
      />
    </>
  );
};
