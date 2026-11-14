import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  FileText,
  X,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useReports, ReportFilterOptions } from '../hooks/useReports';
import { ReportTable } from '../components/reports/ReportTable';
import { ReportCard } from '../components/reports/ReportCard';
import { ReportDetailsDrawer } from '../components/reports/ReportDetailsDrawer';
import { EmptyState } from '../components/ui/EmptyState';
import { CATEGORIES, PRIORITIES, STATUS_ORDER } from '../utils/formatters';
import { PriorityLevel, ReportCategory, ReportItem, ReportStatus, SyncState } from '../types';
import { SkeletonCard, SkeletonTable } from '../components/ui/SkeletonCard';
import { db } from '../db';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPriority = (searchParams.get('priority') as PriorityLevel) || 'all';
  const initialCategory = (searchParams.get('category') as ReportCategory) || 'all';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ReportCategory | 'all'>(initialCategory);
  const [priority, setPriority] = useState<PriorityLevel | 'all'>(initialPriority);
  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [syncStatus, setSyncStatus] = useState<SyncState | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'reportedAt' | 'priority' | 'status'>('reportedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [includeDrafts, setIncludeDrafts] = useState(true);

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const filters: ReportFilterOptions = {
    search,
    category,
    priority,
    status,
    syncStatus,
    sortBy,
    sortOrder,
    includeDrafts,
  };

  const { reports, isLoading } = useReports(filters);

  // Apply favorites filter locally
  const filteredReports = onlyFavorites
    ? reports.filter((r) => r.isFavorite)
    : reports;

  const hasActiveFilters =
    category !== 'all' ||
    priority !== 'all' ||
    status !== 'all' ||
    syncStatus !== 'all' ||
    onlyFavorites ||
    search.trim().length > 0;

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setPriority('all');
    setStatus('all');
    setSyncStatus('all');
    setOnlyFavorites(false);
    setSearchParams({});
  };

  const handleCategoryChipClick = (cat: ReportCategory | 'all') => {
    setCategory(cat);
  };

  const handleCategoryChipKeyDown = (
    e: React.KeyboardEvent,
    cat: ReportCategory | 'all'
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCategory(cat);
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Field Registry
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
              {filteredReports.length} matching reports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Infrastructure Reports
          </h1>
        </div>

        <Link
          to="/reports/new"
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#163A5F] hover:bg-[#1E4B7A] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Horizontal Category Chips Bar - Scrolls horizontally without a visible scrollbar */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Filter by Category
        </label>
        <div
          role="region"
          aria-label="Category Filters"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <button
            type="button"
            role="button"
            tabIndex={0}
            onClick={() => handleCategoryChipClick('all')}
            onKeyDown={(e) => handleCategoryChipKeyDown(e, 'all')}
            aria-pressed={category === 'all' && !onlyFavorites}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none shrink-0 ${
              category === 'all' && !onlyFavorites
                ? 'bg-[#163A5F] dark:bg-blue-600 text-white border-[#163A5F] dark:border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.label && !onlyFavorites;
            return (
              <button
                type="button"
                key={cat.label}
                role="button"
                tabIndex={0}
                onClick={() => handleCategoryChipClick(cat.label)}
                onKeyDown={(e) => handleCategoryChipKeyDown(e, cat.label)}
                aria-pressed={isSelected}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none shrink-0 ${
                  isSelected
                    ? 'bg-[#163A5F] dark:bg-blue-600 text-white border-[#163A5F] dark:border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          {/* Starred / Flagged filter chip */}
          <button
            type="button"
            role="button"
            tabIndex={0}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOnlyFavorites(!onlyFavorites);
              }
            }}
            aria-pressed={onlyFavorites}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none shrink-0 ${
              onlyFavorites
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : 'text-amber-500'}`} />
            <span>Starred</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        {/* Search Bar + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by ID, keyword, hazard details, or address..."
              aria-label="Search reports"
              className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-9 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white dark:bg-slate-950"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search input"
                className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <label htmlFor="sort-select" className="sr-only">Sort reports</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="min-h-[44px] text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-3 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="reportedAt">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label={`Switch sort order to ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
              title={`Switch to ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label htmlFor="priority-filter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Workflow Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              {STATUS_ORDER.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sync-filter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Sync State
            </label>
            <select
              id="sync-filter"
              value={syncStatus}
              onChange={(e) => setSyncStatus(e.target.value as any)}
              className="min-h-[44px] w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Sync States</option>
              <option value="Pending">Pending Sync</option>
              <option value="Synchronizing">Synchronizing</option>
              <option value="Synchronized">Synchronized</option>
              <option value="Failed">Failed (Needs Retry)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-semibold">Active filters applied</span>
            <button
              onClick={handleClearFilters}
              className="min-h-[44px] inline-flex items-center text-blue-700 hover:text-blue-900 font-bold underline px-2 py-1"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Reports Data View: Table on Desktop, Cards on Mobile, Skeletons when Loading */}
      {isLoading ? (
        <>
          <div className="hidden md:block">
            <SkeletonTable rows={4} />
          </div>
          <div className="md:hidden space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports match your filters"
          description="We couldn't find any infrastructure reports matching your current search or category selections."
          actionText="Clear All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <>
          {/* Desktop Table (at >= 768px/1024px) */}
          <div className="hidden md:block">
            <ReportTable reports={filteredReports} onSelectReport={(r) => setSelectedReport(r)} />
          </div>

          {/* Mobile Cards (at < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onSelectReport={(r) => setSelectedReport(r)}
              />
            ))}
          </div>
        </>
      )}

      {/* Slide-over Detail Drawer / Mobile Bottom Sheet */}
      <ReportDetailsDrawer
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
