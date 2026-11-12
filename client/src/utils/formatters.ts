import { PriorityLevel, ReportCategory, ReportStatus, SyncState } from '../types';

export const CATEGORIES: { label: ReportCategory; description: string; icon: string }[] = [
  { label: 'Water Point', description: 'Pumps, boreholes, pipeline leaks, pressure failures', icon: 'Droplets' },
  { label: 'Equipment Damage', description: 'Generators, control panels, heavy machinery, meters', icon: 'Wrench' },
  { label: 'Service Interruption', description: 'Power grid outages, water cutoffs, telecommunication failure', icon: 'ZapOff' },
  { label: 'Safety Concern', description: 'Exposed high voltage wiring, trench cave-in, hazardous leaks', icon: 'ShieldAlert' },
  { label: 'Maintenance Requirement', description: 'Scheduled preventive service, lubrication, filter replacements', icon: 'CalendarClock' },
  { label: 'Other', description: 'General civil works, access road obstruction, fencing', icon: 'HelpCircle' },
];

export const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export const STATUS_ORDER: ReportStatus[] = [
  'Draft',
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const TECHNICIANS_LIST = [
  'Civil Rapid Response Unit A',
  'Mechanical Systems Team (Lead: Marcus Vance)',
  'Hydraulics & Water Works Group',
  'High-Voltage Electrical Squad',
  'Environmental & Safety Response',
  'Preventive Maintenance Crew 04',
];

export function getPriorityColor(priority: PriorityLevel): {
  text: string;
  bg: string;
  border: string;
} {
  switch (priority) {
    case 'Critical':
      return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    case 'High':
      return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    case 'Medium':
      return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'Low':
      return { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
  }
}

export function getStatusColor(status: ReportStatus): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'Draft':
      return { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
    case 'Submitted':
      return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'Assigned':
      return { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    case 'In Progress':
      return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    case 'Resolved':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    case 'Rejected':
      return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
  }
}

export function getSyncColor(sync: SyncState): {
  text: string;
  bg: string;
  border: string;
} {
  switch (sync) {
    case 'Synchronized':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    case 'Synchronizing':
      return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'Pending':
      return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    case 'Failed':
      return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    case 'Conflict':
      return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' };
  }
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function generateReportId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REP-${year}-${random}`;
}
