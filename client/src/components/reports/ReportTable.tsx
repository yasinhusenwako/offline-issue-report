import React from 'react';
import { ReportItem } from '../../types';
import { PriorityBadge, StatusBadge, SyncBadge } from '../ui/Badges';
import { formatDate } from '../../utils/formatters';
import { Eye, MapPin } from 'lucide-react';
import { LikeButton } from '../ui/LikeButton';
import { db } from '../../db';

interface ReportTableProps {
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({ reports, onSelectReport }) => {
  const handleToggleFavorite = async (e: React.MouseEvent | React.KeyboardEvent, report: ReportItem) => {
    e.stopPropagation();
    const updated = !report.isFavorite;
    await db.reports.update(report.id, { isFavorite: updated });
  };

  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs transition-colors">
      <table className="w-full text-left border-collapse text-xs">
        <caption className="sr-only">Infrastructure Reports Directory</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <th scope="col" className="py-3.5 px-4 w-10">Flag</th>
            <th scope="col" className="py-3.5 px-4">Report ID</th>
            <th scope="col" className="py-3.5 px-4">Category</th>
            <th scope="col" className="py-3.5 px-4">Hazard Summary</th>
            <th scope="col" className="py-3.5 px-4">Location</th>
            <th scope="col" className="py-3.5 px-4">Priority</th>
            <th scope="col" className="py-3.5 px-4">Status</th>
            <th scope="col" className="py-3.5 px-4 font-mono">Reported Date</th>
            <th scope="col" className="py-3.5 px-4">Sync State</th>
            <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {reports.map((report) => (
            <tr
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group focus-within:bg-slate-50 dark:focus-within:bg-slate-800/50"
            >
              <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                <LikeButton
                  isLiked={report.isFavorite}
                  onToggle={(e) => handleToggleFavorite(e, report)}
                  reportId={report.id}
                  size="sm"
                />
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {report.id}
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-semibold">
                {report.category}
              </td>
              <td className="py-3 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {report.title}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block">{report.description}</span>
              </td>
              <td className="py-3 px-4 max-w-[180px] truncate text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{report.location.address}</span>
                </div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <PriorityBadge priority={report.priority} />
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <StatusBadge status={report.status} />
              </td>
              <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                {formatDate(report.reportedAt)}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <SyncBadge syncState={report.syncStatus} />
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReport(report);
                  }}
                  className="min-h-[44px] px-3 py-2 text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-bold inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  aria-label={`View details of report ${report.id}`}
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
