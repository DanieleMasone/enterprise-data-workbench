import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../data/initialWorkspace';
import type { WorkspaceOperation } from '../model/operation.types';
import { applyOperation, reorderFields, resizeField, updateRecordCell } from './workspaceMutations';

describe('workspace mutations', () => {
  it('updates a record cell immutably and increments the record version', () => {
    const workspace = createInitialWorkspace();
    const updatedRecords = updateRecordCell(
      workspace.records,
      'rec-revenue-dashboard',
      'status',
      'Done',
      '2026-05-23T10:00:00.000Z',
    );

    const original = workspace.records.find((record) => record.id === 'rec-revenue-dashboard');
    const updated = updatedRecords.find((record) => record.id === 'rec-revenue-dashboard');

    expect(original?.cells.status).toBe('Review');
    expect(updated?.cells.status).toBe('Done');
    expect(updated?.version).toBe((original?.version ?? 0) + 1);
  });

  it('applies operation log entries to the shared document', () => {
    const workspace = createInitialWorkspace();
    const operation: WorkspaceOperation = {
      id: 'op-1',
      clientId: 'test',
      createdAt: '2026-05-23T10:00:00.000Z',
      status: 'pending',
      type: 'cell.update',
      recordId: 'rec-pricing-rules',
      fieldId: 'priority',
      before: 'Low',
      after: 'High',
      baseVersion: 6,
    };

    const updated = applyOperation(workspace, operation);

    expect(updated.records.find((record) => record.id === 'rec-pricing-rules')?.cells.priority).toBe(
      'High',
    );
  });

  it('honors minimum field widths and reorders fields deterministically', () => {
    const workspace = createInitialWorkspace();
    const resized = resizeField(workspace.fields, 'title', 40);
    const reordered = reorderFields(workspace.fieldOrder, 'estimate', 'status');

    expect(resized.find((field) => field.id === 'title')?.width).toBe(180);
    expect(reordered.slice(0, 3)).toEqual(['title', 'estimate', 'status']);
  });
});
