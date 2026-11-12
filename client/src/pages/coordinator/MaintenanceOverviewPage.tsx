import React from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Droplets,
  ZapOff,
  ShieldAlert,
  CalendarClock,
  HelpCircle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { CATEGORIES, TECHNICIANS_LIST } from '../../utils/formatters';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badges';
import { Link } from 'react-router-dom';
import { useCountUp } from '../../hooks/useCountUp';

export const MaintenanceOverviewPage: React.FC = () => {
  const { reports } = useReports({ includeDrafts: false });

  // Group by category
  const categoryStats = CATEGORIES.map((cat) => {
    const catReports = reports.filter((r) => r.category === cat.label);
    const active = catReports.filter((r) => r.status === 'In Progress' || r.status === 'Assigned').length;
    const resolved = catReports.filter((r) => r.status === 'Resolved').length;
    const critical = catReports.filter((r) => r.priority === 'Critical' && r.status !== 'Resolved').length;
    return {
      ...cat,
      total: catReports.length,
      active,
      resolved,
      critical,
    };
  });

  // Technician / Crew workload
  const crewStats = TECHNICIANS_LIST.map((crew) => {
    const assigned = reports.filter((r) => r.assignedTo === crew && r.status !== 'Resolved' && r.status !== 'Rejected');
    const completed = reports.filter((r) => r.assignedTo === crew && r.status === 'Resolved');
    return {
      name: crew,
      activeTickets: assigned.length,
      completedTickets: completed.length,
    };
  });

  // Calculate resolution rate
  const nonDrafts = reports.filter((r) => !r.isDraft && r.status !== 'Rejected');
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const resolutionRate = nonDrafts.length > 0 ? Math.round((resolvedCount / nonDrafts.length) * 100) : 0;
  const activeOrdersCount = reports.filter((r) => r.status === 'In Progress' || r.status === 'Assigned').length;
  const unassignedCount = reports.filter((r) => r.status === 'Submitted' && !r.assignedTo).length;

  const animRate = useCountUp(resolutionRate);
  const animActive = useCountUp(activeOrdersCount);
  const animUnassigned = useCountUp(unassignedCount);

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Asset & Crew Analytics
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
              Resolution Velocity: {animRate}%
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Maintenance Overview & Crew Schedule
          </h1>
        </div>

        <Link
          to="/management"
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#163A5F] hover:bg-[#1E4B7A] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          <Wrench className="w-4 h-4" />
          <span>Go to Triage Queue</span>
        </Link>
      </div>

      {/* High-level performance cards (Hero stat tiles on 8px scale) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Overall Resolution Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-emerald-800 tabular-nums">
              {animRate}%
            </span>
            <span className="text-xs text-slate-600 font-mono font-medium">
              ({resolvedCount}/{nonDrafts.length} tickets)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Audited and verified infrastructure restorations across sectors
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Active Field Work Orders
          </span>
          <div className="text-4xl font-extrabold font-mono text-amber-800 tabular-nums">
            {animActive}
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Dispatched to response crews and active in progress
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Unassigned Submissions
          </span>
          <div className="text-4xl font-extrabold font-mono text-blue-700 tabular-nums">
            {animUnassigned}
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Incoming reports awaiting coordinator review and crew assignment
          </p>
        </div>
      </div>

      {/* Category Breakdown Matrix */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Infrastructure Category Health Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map((cat) => (
            <div
              key={cat.label}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.label}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{cat.description}</p>
                </div>
                {cat.critical > 0 && (
                  <span className="bg-red-50 text-red-800 border border-red-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    {cat.critical} Critical
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-mono uppercase block font-semibold">Total</span>
                  <span className="text-sm font-extrabold font-mono text-slate-900">{cat.total}</span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 font-mono uppercase block font-semibold">In Field</span>
                  <span className="text-sm font-extrabold font-mono text-amber-800">{cat.active}</span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 font-mono uppercase block font-semibold">Resolved</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-800">{cat.resolved}</span>
                </div>
              </div>

              <Link
                to={`/reports?category=${encodeURIComponent(cat.label)}`}
                className="min-h-[44px] flex items-center justify-center text-xs text-blue-700 hover:text-blue-900 font-bold pt-1"
              >
                Inspect Category Tickets →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Response Teams Schedule & Workload */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Crew Workload & Dispatch Distribution
        </h2>
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Field Crew Workload Distribution</caption>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4">Response Unit / Crew</th>
                <th scope="col" className="py-3.5 px-4 font-mono">Active Work Orders</th>
                <th scope="col" className="py-3.5 px-4 font-mono">Resolved Orders</th>
                <th scope="col" className="py-3.5 px-4">Deployment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crewStats.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800 font-bold tabular-nums">
                    {c.activeTickets}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-800 font-bold tabular-nums">
                    {c.completedTickets}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.activeTickets > 2 ? (
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md">
                        High Workload
                      </span>
                    ) : c.activeTickets > 0 ? (
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-md">
                        Deployed
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-md">
                        Standby / Available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
