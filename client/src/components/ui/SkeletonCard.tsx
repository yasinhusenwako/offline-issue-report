import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 animate-pulse">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-2 bg-slate-200 rounded-full" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-16 bg-slate-200 rounded-md" />
      </div>

      {/* Title & description skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-3.5 w-full bg-slate-100 rounded" />
        <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
      </div>

      {/* Location line skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-14 bg-slate-200 rounded" />
        </div>
        <div className="h-4 w-28 bg-slate-200 rounded" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-6">
        <div className="h-3.5 w-20 bg-slate-200 rounded" />
        <div className="h-3.5 w-24 bg-slate-200 rounded" />
        <div className="h-3.5 w-48 bg-slate-200 rounded" />
        <div className="h-3.5 w-32 bg-slate-200 rounded" />
        <div className="h-3.5 w-16 bg-slate-200 rounded ml-auto" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-6 animate-pulse">
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-100 rounded" />
            <div className="h-4 w-36 bg-slate-100 rounded" />
            <div className="h-6 w-16 bg-slate-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};
