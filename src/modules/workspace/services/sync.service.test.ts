import { describe, expect, it } from 'vitest';
import type { WorkspaceOperation } from '../model';
import { MockWorkspaceSyncService } from './sync.service';

describe('mock workspace sync service', () => {
  it('acknowledges non-conflicting operations', async () => {
    const service = new MockWorkspaceSyncService({
      delayMs: 0,
      now: () => '2026-05-23T10:00:00.000Z',
      createId: (prefix) => `${prefix}-1`,
    });
    const operation = createCellOperation('Updated owner');

    const result = await service.submitOperations([operation]);

    expect(result.acknowledgedOperationIds).toEqual(['op-1']);
    expect(result.conflicts).toHaveLength(0);
    expect(result.syncedAt).toBe('2026-05-23T10:00:00.000Z');
  });

  it('returns deterministic conflicts for conflict-keyword edits', async () => {
    const service = new MockWorkspaceSyncService({
      delayMs: 0,
      now: () => '2026-05-23T10:00:01.000Z',
      createId: (prefix) => `${prefix}-1`,
    });
    const operation = createCellOperation('Needs conflict review');

    const result = await service.submitOperations([operation]);

    expect(result.acknowledgedOperationIds).toEqual([]);
    expect(result.conflicts[0]).toMatchObject({
      id: 'conflict-1',
      operationId: 'op-1',
      fieldId: 'owner',
      localValue: 'Needs conflict review',
      remoteValue: 'Maya',
      status: 'open',
    });
  });

  it('creates status movement conflicts against the status field', async () => {
    const service = new MockWorkspaceSyncService({
      delayMs: 0,
      now: () => '2026-05-23T10:00:02.000Z',
      createId: (prefix) => `${prefix}-1`,
    });
    const operation: WorkspaceOperation = {
      id: 'op-status-1',
      clientId: 'test',
      createdAt: '2026-05-23T10:00:02.000Z',
      status: 'pending',
      type: 'record.status.move',
      recordId: 'rec-analytics-migration',
      statusFieldId: 'status',
      before: 'Delivery',
      after: 'Conflict lane',
      baseVersion: 3,
    };

    const result = await service.submitOperations([operation]);

    expect(result.conflicts[0]?.fieldId).toBe('status');
    expect(result.conflicts[0]?.remoteValue).toBe('Delivery');
  });
});

function createCellOperation(after: string): WorkspaceOperation {
  return {
    id: 'op-1',
    clientId: 'test',
    createdAt: '2026-05-23T10:00:00.000Z',
    status: 'pending',
    type: 'cell.update',
    recordId: 'rec-analytics-migration',
    fieldId: 'owner',
    before: 'Maya',
    after,
    baseVersion: 3,
  };
}
