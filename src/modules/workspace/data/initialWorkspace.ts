import type { PersistedWorkspace } from '../model/sync.types';
import type { WorkbenchRecord, WorkspaceField } from '../model/record.types';

const fields: readonly WorkspaceField[] = [
  {
    id: 'title',
    label: 'Initiative',
    type: 'text',
    width: 260,
    minWidth: 180,
  },
  {
    id: 'status',
    label: 'Status',
    type: 'status',
    width: 156,
    minWidth: 128,
    options: [
      { value: 'Discovery', label: 'Discovery', tone: 'info' },
      { value: 'Delivery', label: 'Delivery', tone: 'warning' },
      { value: 'Review', label: 'Review', tone: 'neutral' },
      { value: 'Done', label: 'Done', tone: 'success' },
    ],
  },
  {
    id: 'owner',
    label: 'Owner',
    type: 'owner',
    width: 160,
    minWidth: 128,
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'priority',
    width: 132,
    minWidth: 110,
    options: [
      { value: 'High', label: 'High', tone: 'danger' },
      { value: 'Medium', label: 'Medium', tone: 'warning' },
      { value: 'Low', label: 'Low', tone: 'neutral' },
    ],
  },
  {
    id: 'dueDate',
    label: 'Due date',
    type: 'date',
    width: 144,
    minWidth: 120,
  },
  {
    id: 'estimate',
    label: 'Estimate',
    type: 'number',
    width: 116,
    minWidth: 96,
  },
];

const records: readonly WorkbenchRecord[] = [
  {
    id: 'rec-analytics-migration',
    cells: {
      title: 'Analytics warehouse migration',
      status: 'Delivery',
      owner: 'Maya',
      priority: 'High',
      dueDate: '2026-06-02',
      estimate: 18,
    },
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-05-21T14:00:00.000Z',
    version: 3,
  },
  {
    id: 'rec-revenue-dashboard',
    cells: {
      title: 'Revenue cockpit dashboard',
      status: 'Review',
      owner: 'Jon',
      priority: 'Medium',
      dueDate: '2026-05-28',
      estimate: 8,
    },
    createdAt: '2026-05-11T09:00:00.000Z',
    updatedAt: '2026-05-22T11:30:00.000Z',
    version: 5,
  },
  {
    id: 'rec-compliance-export',
    cells: {
      title: 'Regulatory export workflow',
      status: 'Discovery',
      owner: 'Priya',
      priority: 'High',
      dueDate: '2026-06-10',
      estimate: 13,
    },
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-18T15:45:00.000Z',
    version: 2,
  },
  {
    id: 'rec-pricing-rules',
    cells: {
      title: 'Pricing rules review',
      status: 'Done',
      owner: 'Theo',
      priority: 'Low',
      dueDate: '2026-05-24',
      estimate: 3,
    },
    createdAt: '2026-05-09T09:00:00.000Z',
    updatedAt: '2026-05-20T10:00:00.000Z',
    version: 6,
  },
  {
    id: 'rec-customer-health',
    cells: {
      title: 'Customer health segmentation',
      status: 'Delivery',
      owner: 'Lena',
      priority: 'Medium',
      dueDate: '2026-06-05',
      estimate: 11,
    },
    createdAt: '2026-05-13T09:00:00.000Z',
    updatedAt: '2026-05-23T08:30:00.000Z',
    version: 4,
  },
  {
    id: 'rec-retention-calendar',
    cells: {
      title: 'Retention campaign calendar',
      status: 'Discovery',
      owner: 'Amir',
      priority: 'Low',
      dueDate: '2026-06-17',
      estimate: 5,
    },
    createdAt: '2026-05-14T09:00:00.000Z',
    updatedAt: '2026-05-21T09:15:00.000Z',
    version: 1,
  },
];

/** Creates a fresh persisted document so tests and hydration do not share references. */
export function createInitialWorkspace(now = new Date().toISOString()): PersistedWorkspace {
  return {
    fields: fields.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined })),
    fieldOrder: fields.map((field) => field.id),
    records: records.map((record) => ({
      ...record,
      cells: { ...record.cells },
    })),
    operationLog: [],
    conflicts: [],
    sync: {
      mode: 'idle',
      pendingCount: 0,
      lastSyncedAt: now,
      error: null,
    },
  };
}
