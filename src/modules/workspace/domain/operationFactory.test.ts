import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../data/initialWorkspace';
import { WorkspaceOperationFactory } from './operationFactory';

const factory = new WorkspaceOperationFactory({
  clientId: 'test-client',
  createId: (prefix) => `${prefix}-1`,
  now: () => '2026-05-23T10:00:00.000Z',
});

describe('workspace operation factory', () => {
  it('creates cell update operations with before/after values and base version', () => {
    const workspace = createInitialWorkspace();
    const record = workspace.records[0]!;

    const operation = factory.createCellUpdate(record, 'owner', 'Nadia');

    expect(operation).toMatchObject({
      id: 'op-cell-1',
      clientId: 'test-client',
      type: 'cell.update',
      recordId: record.id,
      fieldId: 'owner',
      before: 'Maya',
      after: 'Nadia',
      baseVersion: record.version,
      status: 'pending',
    });
  });

  it('creates layout operations with complete order snapshots', () => {
    const workspace = createInitialWorkspace();
    const operation = factory.createColumnReorder(workspace.fieldOrder, 'estimate', 'status');

    expect(operation.beforeOrder).toEqual(workspace.fieldOrder);
    expect(operation.afterOrder.slice(0, 3)).toEqual(['title', 'estimate', 'status']);
  });
});
