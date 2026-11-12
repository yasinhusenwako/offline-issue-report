import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ReportItem, ReportStatus } from '../../types';
import { db } from '../../db';
import { syncService } from '../../services/syncService';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableStatusTransitions, isValidStatusTransition } from '../../utils/workflow';
import { StatusBadge } from '../ui/Badges';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface StatusChangeModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userName, role } = useAuth();
  const [targetStatus, setTargetStatus] = useState<ReportStatus | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  const availableStatuses = getAvailableStatusTransitions(report.status, role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetStatus) {
      setError('Please select a target status.');
      return;
    }

    const validation = isValidStatusTransition(report.status, targetStatus, role);
    if (!validation.allowed) {
      setError(validation.reason || 'Invalid status transition.');
      return;
    }

    if (targetStatus === 'Rejected' && !rejectionReason.trim()) {
      setError('A clear rejection reason is mandatory when rejecting an infrastructure report.');
      return;
    }

    if (targetStatus === 'Resolved' && !resolutionNotes.trim()) {
      setError('Please provide maintenance resolution notes describing work completed.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const updatedReport: ReportItem = {
        ...report,
        status: targetStatus,
        updatedAt: now,
        ...(targetStatus === 'Rejected' ? { rejectionReason: rejectionReason.trim() } : {}),
        ...(targetStatus === 'Resolved'
          ? { resolutionNotes: resolutionNotes.trim(), resolvedAt: now }
          : {}),
      };

      await db.reports.put(updatedReport);

      let actionType: any = 'status_changed';
      let description = `Status transitioned from ${report.status} to ${targetStatus} by ${userName}`;
      if (targetStatus === 'Resolved') {
        actionType = 'report_resolved';
        description = `Report resolved by ${userName}. Notes: ${resolutionNotes.trim()}`;
      } else if (targetStatus === 'Rejected') {
        actionType = 'report_rejected';
        description = `Report rejected by ${userName}. Reason: ${rejectionReason.trim()}`;
      }

      await db.activities.add({
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reportId: report.id,
        reportTitle: report.title,
        action: actionType,
        description,
        timestamp: now,
        userName,
        userRole: role,
        metadata: {
          from: report.status,
          to: targetStatus,
          rejectionReason: targetStatus === 'Rejected' ? rejectionReason : undefined,
          resolutionNotes: targetStatus === 'Resolved' ? resolutionNotes : undefined,
        },
      });

      await syncService.enqueue(updatedReport, 'status_change', { userName, userRole: role });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Report Workflow Status"
      description={`Enforce strict sequential workflow progression for ${report.id}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-300 text-red-950 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current status display */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="text-xs text-slate-700 font-bold uppercase tracking-wider">Current Status</div>
          <StatusBadge status={report.status} />
        </div>

        {/* Target status selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Permitted Next Status in Workflow
          </label>
          {availableStatuses.length === 0 ? (
            <p className="text-xs text-slate-600 italic font-medium">
              No further automatic transitions available from this status.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableStatuses.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => {
                    setTargetStatus(st);
                    setError(null);
                  }}
                  className={`min-h-[44px] p-3 text-left rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    targetStatus === st
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span>{st}</span>
                  </div>
                  {targetStatus === st && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rejection reason conditional field */}
        {targetStatus === 'Rejected' && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-2">
            <label htmlFor="rejection-reason-input" className="block text-xs font-bold uppercase tracking-wider text-rose-950">
              Mandatory Rejection Reason *
            </label>
            <textarea
              id="rejection-reason-input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
              placeholder="State clear operational reason (e.g. duplicate ticket, out of service jurisdiction, invalid coordinates)..."
              className="w-full text-xs font-medium border border-rose-300 rounded-lg p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
            />
          </div>
        )}

        {/* Resolution notes conditional field */}
        {targetStatus === 'Resolved' && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
            <label htmlFor="resolution-notes-input" className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
              Maintenance Resolution Notes *
            </label>
            <textarea
              id="resolution-notes-input"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              required
              placeholder="Detail replacement parts, torque specs, hydraulic pressure restored, safety tests passed..."
              className="w-full text-xs font-medium border border-emerald-300 rounded-lg p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !targetStatus}
            className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-[#163A5F] hover:bg-[#1E4B7A] rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isSubmitting ? 'Updating...' : 'Apply Transition'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
