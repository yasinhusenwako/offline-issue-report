import Dexie, { type Table } from 'dexie';
import { ActivityLog, AppSettings, ReportItem, SyncQueueItem } from '../types';

export class InfraSyncDatabase extends Dexie {
  reports!: Table<ReportItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  activities!: Table<ActivityLog, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('InfraSyncDatabase');
    this.version(1).stores({
      reports: 'id, category, priority, status, syncStatus, reportedAt, updatedAt, isDraft',
      syncQueue: 'id, reportId, status, createdAt, attempts',
      activities: 'id, reportId, action, timestamp, userRole',
      settings: 'id',
    });
  }
}

export const db = new InfraSyncDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  workerName: 'Elena Rostova',
  workerId: 'FW-8492',
  department: 'Northern Sector Utilities',
  autoSyncEnabled: true,
  syncIntervalSeconds: 30,
  mockNetworkLatencyMs: 600,
  simulateOffline: false,
  simulateFailureRatePercent: 15,
};

// Initial Seed Data to bootstrap field environment
export async function initializeDatabase() {
  const count = await db.reports.count();
  if (count > 0) return;

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3600000 * 3).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 86400000 * 2).toISOString();

  const seedReports: ReportItem[] = [
    {
      id: 'REP-2026-1042',
      title: 'Main Pipeline High Pressure Flange Rupture',
      category: 'Water Point',
      description: 'Severe potable water blowout near Sector 4 pumping junction. Flow rate loss ~450 L/min. Soil erosion threatening adjacent electrical substation footing.',
      location: {
        address: 'Sector 4 Junction, North Distribution Ring, Sector 4',
        latitude: 52.5201,
        longitude: 13.4049,
        accuracyMeters: 6,
      },
      priority: 'Critical',
      status: 'In Progress',
      syncStatus: 'Synchronized',
      reportedAt: twoDaysAgo,
      updatedAt: oneHourAgo,
      authorName: 'Elena Rostova',
      authorId: 'FW-8492',
      assignedTo: 'Hydraulics & Water Works Group',
      assignedAt: oneDayAgo,
      isDraft: false,
    },
    {
      id: 'REP-2026-1049',
      title: 'Auxiliary Generator Transformer Overheat Warning',
      category: 'Equipment Damage',
      description: 'Transformer cooling fan bearing seized on Backup Unit B. Temperature sensors read 84°C under 60% load. Smells of scorched insulation.',
      location: {
        address: 'Substation West Wing, Facility compound B',
        latitude: 52.5165,
        longitude: 13.3777,
        accuracyMeters: 4,
      },
      priority: 'High',
      status: 'Assigned',
      syncStatus: 'Synchronized',
      reportedAt: oneDayAgo,
      updatedAt: threeHoursAgo,
      authorName: 'Elena Rostova',
      authorId: 'FW-8492',
      assignedTo: 'High-Voltage Electrical Squad',
      assignedAt: threeHoursAgo,
      isDraft: false,
    },
    {
      id: 'REP-2026-1054',
      title: 'Unsecured Trench Barrier & Missing Road Warning Lights',
      category: 'Safety Concern',
      description: 'Night marker beacons vandalized; 2.5m open excavation ditch missing amber flashing beacons. High risk for nocturnal patrol vehicles.',
      location: {
        address: 'Service Access Road KM 14.2, East Perimeter',
        latitude: 52.5082,
        longitude: 13.4312,
        accuracyMeters: 12,
      },
      priority: 'High',
      status: 'Submitted',
      syncStatus: 'Pending',
      reportedAt: oneHourAgo,
      updatedAt: oneHourAgo,
      authorName: 'Elena Rostova',
      authorId: 'FW-8492',
      isDraft: false,
    },
    {
      id: 'REP-2026-1055',
      title: 'Scheduled Lubrication on Hydro Pump P-03',
      category: 'Maintenance Requirement',
      description: 'Routine 500-hour grease packing and seal inspection. Intake vibration measured 1.8mm/s (within nominal parameters).',
      location: {
        address: 'Hydro-Station Intake 03, Riverside Basin',
        latitude: 52.4952,
        longitude: 13.4518,
        accuracyMeters: 8,
      },
      priority: 'Low',
      status: 'Resolved',
      syncStatus: 'Synchronized',
      reportedAt: twoDaysAgo,
      updatedAt: oneDayAgo,
      authorName: 'Elena Rostova',
      authorId: 'FW-8492',
      assignedTo: 'Preventive Maintenance Crew 04',
      assignedAt: twoDaysAgo,
      resolutionNotes: 'Synthetic bearing grease replaced, flange seal torqued to 120Nm. Intake vibration dropped to 0.7mm/s.',
      resolvedAt: oneDayAgo,
      isDraft: false,
    },
    {
      id: 'REP-2026-1058',
      title: 'Preliminary Survey on Feeder Cable Sag',
      category: 'Service Interruption',
      description: 'Draft notes on 240V overhead feeder sag caused by fallen pine limb during morning wind storm. Need clearance measurement before finalizing.',
      location: {
        address: 'Line Post 44B, Forestry Trailhead 9',
        latitude: 52.4821,
        longitude: 13.3912,
        accuracyMeters: 15,
      },
      priority: 'Medium',
      status: 'Draft',
      syncStatus: 'Pending',
      reportedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      authorName: 'Elena Rostova',
      authorId: 'FW-8492',
      isDraft: true,
    },
  ];

  await db.reports.bulkAdd(seedReports);

  // Add the pending item to the sync queue
  const pendingSyncItem: SyncQueueItem = {
    id: 'SYNC-1054',
    reportId: 'REP-2026-1054',
    action: 'create',
    payload: seedReports[2],
    createdAt: oneHourAgo,
    attempts: 0,
    maxAttempts: 5,
    status: 'Pending',
  };
  await db.syncQueue.add(pendingSyncItem);

  // Seed Activity Log
  const seedActivities: ActivityLog[] = [
    {
      id: 'ACT-001',
      reportId: 'REP-2026-1042',
      reportTitle: 'Main Pipeline High Pressure Flange Rupture',
      action: 'report_created',
      description: 'Report initiated by field worker Elena Rostova',
      timestamp: twoDaysAgo,
      userName: 'Elena Rostova',
      userRole: 'field_worker',
    },
    {
      id: 'ACT-002',
      reportId: 'REP-2026-1042',
      reportTitle: 'Main Pipeline High Pressure Flange Rupture',
      action: 'report_synchronized',
      description: 'Report synchronized to central infrastructure backend',
      timestamp: twoDaysAgo,
      userName: 'Elena Rostova',
      userRole: 'field_worker',
    },
    {
      id: 'ACT-003',
      reportId: 'REP-2026-1042',
      reportTitle: 'Main Pipeline High Pressure Flange Rupture',
      action: 'report_assigned',
      description: 'Assigned to Hydraulics & Water Works Group by Dispatch',
      timestamp: oneDayAgo,
      userName: 'David Miller (Coordinator)',
      userRole: 'coordinator',
      metadata: { assignedTo: 'Hydraulics & Water Works Group' },
    },
    {
      id: 'ACT-004',
      reportId: 'REP-2026-1042',
      reportTitle: 'Main Pipeline High Pressure Flange Rupture',
      action: 'status_changed',
      description: 'Status updated from Assigned to In Progress',
      timestamp: oneHourAgo,
      userName: 'David Miller (Coordinator)',
      userRole: 'coordinator',
      metadata: { from: 'Assigned', to: 'In Progress' },
    },
    {
      id: 'ACT-005',
      reportId: 'REP-2026-1049',
      reportTitle: 'Auxiliary Generator Transformer Overheat Warning',
      action: 'report_created',
      description: 'Report initiated by field worker Elena Rostova',
      timestamp: oneDayAgo,
      userName: 'Elena Rostova',
      userRole: 'field_worker',
    },
    {
      id: 'ACT-006',
      reportId: 'REP-2026-1049',
      reportTitle: 'Auxiliary Generator Transformer Overheat Warning',
      action: 'report_assigned',
      description: 'Assigned to High-Voltage Electrical Squad',
      timestamp: threeHoursAgo,
      userName: 'David Miller (Coordinator)',
      userRole: 'coordinator',
      metadata: { assignedTo: 'High-Voltage Electrical Squad' },
    },
    {
      id: 'ACT-007',
      reportId: 'REP-2026-1054',
      reportTitle: 'Unsecured Trench Barrier & Missing Road Warning Lights',
      action: 'report_submitted',
      description: 'Report submitted by field worker and enqueued for local synchronization',
      timestamp: oneHourAgo,
      userName: 'Elena Rostova',
      userRole: 'field_worker',
    },
    {
      id: 'ACT-008',
      reportId: 'REP-2026-1055',
      reportTitle: 'Scheduled Lubrication on Hydro Pump P-03',
      action: 'report_resolved',
      description: 'Report marked as Resolved with maintenance notes',
      timestamp: oneDayAgo,
      userName: 'David Miller (Coordinator)',
      userRole: 'coordinator',
    },
  ];

  await db.activities.bulkAdd(seedActivities);
  await db.settings.put(DEFAULT_SETTINGS);
}
