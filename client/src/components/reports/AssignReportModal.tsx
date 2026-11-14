import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ReportItem } from '../../types';
import { TECHNICIANS_LIST } from '../../utils/formatters';
import { db } from '../../db';
import { syncService } from '../../services/syncService';
import { useAuth } from '../../contexts/AuthContext';
import { Users, AlertCircle } from 'lucide-react';

interface AssignReportModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignReportModal: React.FC<AssignReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userName, role } = useAuth();
  const [selectedCrew, setSelectedCrew] = useState('');
  const [customCrew, setCustomCrew] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCrew = customCrew.trim() || selectedCrew;

    if (!finalCrew) {
      setError('Please select or specify a response team or technician.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const nextStatus = report.status === 'Submitted' ? 'Assigned' : report.status;

      const updatedReport: ReportItem = {
        ...report,
        assignedTo: finalCrew,
        assignedAt: now,
        status: nextStatus,
        updatedAt: now,
      };

      await db.reports.put(updatedReport);

      await db.activities.add({
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reportId: report.id,
        reportTitle: report.title,
        action: 'report_assigned',
        description: `Assigned to "${finalCrew}" by ${userName}. ${notes ? `Notes: ${notes}` : ''}`,
        timestamp: now,
        userName,
        userRole: role,
        metadata: { assignedTo: finalCrew, notes },
      });

      await syncService.enqueue(updatedReport, 'update', { userName, userRole: role });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign crew.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Maintenance Response Crew"
      description={`Assign designated technical response team for ${report.id}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-300 text-red-950 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="assign-crew-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Select Designated Unit / Team *
          </label>
          <select
            id="assign-crew-select"
            value={selectedCrew}
            onChange={(e) => {
              setSelectedCrew(e.target.value);
              if (e.target.value) setCustomCrew('');
            }}
            className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">-- Choose from available response teams --</option>
            {TECHNICIANS_LIST.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="custom-crew-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Or Specify Other Team / Technician
          </label>
          <input
            id="custom-crew-input"
            type="text"
            value={customCrew}
            onChange={(e) => {
              setCustomCrew(e.target.value);
              if (e.target.value) setSelectedCrew('');
            }}
            placeholder="e.g. External Structural Specialist Contractors"
            className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div>
          <label htmlFor="dispatch-notes-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Dispatch Instructions / Notes (Optional)
          </label>
          <textarea
            id="dispatch-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Specify safety gear, gate clearance codes, or hydraulic tooling..."
            className="w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>{isSubmitting ? 'Assigning...' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
