import React from 'react';
import { ReportItem } from '../../types';
import { PriorityBadge, StatusBadge, SyncBadge } from '../ui/Badges';
import { formatDate } from '../../utils/formatters';
import { MapPin, ChevronRight, Users } from 'lucide-react';
import { LikeButton } from '../ui/LikeButton';
import { db } from '../../db';

interface ReportCardProps {
  report: ReportItem;
  onSelectReport: (report: ReportItem) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onSelectReport }) => {
  const handleToggleFavorite = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const updated = !report.isFavorite;
    await db.reports.update(report.id, { isFavorite: updated });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectReport(report)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectReport(report);
        }
      }}
      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs cursor-pointer space-y-3.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-400">{report.id}</span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{report.category}</span>
          {report.isDraft && (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[10px] px-2 py-0.5 rounded font-bold">
              Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <SyncBadge syncState={report.syncStatus} showLabel={false} />
          <LikeButton
            isLiked={report.isFavorite}
            onToggle={handleToggleFavorite}
            reportId={report.id}
            size="sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{report.title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {report.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="truncate font-medium">{report.location.address}</span>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>

        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <span>{formatDate(report.reportedAt)}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        </div>
      </div>

      {report.assignedTo && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-900 dark:text-indigo-200 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md font-medium">
          <Users className="w-3.5 h-3.5 shrink-0 text-indigo-700 dark:text-indigo-400" />
          <span className="truncate">Assigned: {report.assignedTo}</span>
        </div>
      )}
    </div>
  );
};
