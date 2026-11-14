import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/70 shadow-xs space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-1">
        <Icon className="w-7 h-7 stroke-[1.75]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed font-medium">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="min-h-[44px] mt-2 px-5 py-2.5 text-xs font-bold text-white bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
