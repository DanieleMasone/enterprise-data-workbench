import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../data/initialWorkspace';
import {
  getNextCellAddress,
  getOrderedFields,
  groupRecordsByDate,
  groupRecordsByStatus,
  parseFieldValue,
  sortRecords,
} from './workspaceSelectors';

describe('workspace selectors', () => {
  it('orders fields from the shared field order', () => {
    const workspace = createInitialWorkspace();
    const orderedFields = getOrderedFields({
      fields: workspace.fields,
      fieldOrder: ['status', 'title', 'owner'],
    });

    expect(orderedFields.map((field) => field.id)).toEqual(['status', 'title', 'owner']);
  });

  it('sorts records with numeric and text-safe comparisons', () => {
    const workspace = createInitialWorkspace();
    const sorted = sortRecords(workspace.records, { fieldId: 'estimate', direction: 'desc' });

    expect(sorted[0]?.cells.title).toBe('Analytics warehouse migration');
    expect(sorted.at(-1)?.cells.title).toBe('Pricing rules review');
  });

  it('clamps keyboard navigation to the document bounds', () => {
    const workspace = createInitialWorkspace();
    const lastRecord = workspace.records.at(-1);

    expect(lastRecord).toBeDefined();
    const nextCell = getNextCellAddress(
      workspace,
      { recordId: lastRecord?.id ?? '', fieldId: 'estimate' },
      1,
      1,
    );

    expect(nextCell).toEqual({ recordId: lastRecord?.id, fieldId: 'estimate' });
  });

  it('parses field editor values by field type', () => {
    const workspace = createInitialWorkspace();
    const estimate = workspace.fields.find((field) => field.id === 'estimate');
    const title = workspace.fields.find((field) => field.id === 'title');

    expect(estimate).toBeDefined();
    expect(title).toBeDefined();
    expect(parseFieldValue(estimate!, ' 12 ')).toBe(12);
    expect(parseFieldValue(title!, '  Executive dashboard ')).toBe('Executive dashboard');
    expect(parseFieldValue(title!, '   ')).toBeNull();
  });

  it('projects the same records into kanban and calendar groupings', () => {
    const workspace = createInitialWorkspace();
    const statusField = workspace.fields.find((field) => field.id === 'status');

    expect(statusField).toBeDefined();
    const kanbanGroups = groupRecordsByStatus(workspace.records, statusField!);
    const calendarGroups = groupRecordsByDate(workspace.records, 'dueDate');

    expect(kanbanGroups.Delivery).toHaveLength(2);
    expect(calendarGroups['2026-06-02']?.[0]?.id).toBe('rec-analytics-migration');
  });
});
