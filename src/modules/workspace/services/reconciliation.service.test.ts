import { describe, expect, it } from 'vitest';
import type { RemoteWorkspaceOperation } from '../model';
import { createTestWorkspaceStore } from '../test/createTestStore';
import {
  createManualConflict,
  reconcileSyncResult,
  resolveWorkspaceConflict,
} from './reconciliation.service';

describe('reconciliation service', () => {
  it('acknowledges submitted operations and clears pending sync status', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-revenue-dashboard', 'owner', 'Sam');

    const operation = store.getState().operationLog[0];
    expect(operation).toBeDefined();
    const reconciled = reconcileSyncResult(store.getState(), {
      acknowledgedOperationIds: [operation?.id ?? ''],
      conflicts: [],
      remoteOperations: [],
      syncedAt: '2026-05-23T10:00:10.000Z',
    });

    expect(reconciled.operationLog[0]?.status).toBe('acknowledged');
    expect(reconciled.sync.pendingCount).toBe(0);
  });

  it('tracks conflicts separately from the optimistic record value', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-compliance-export', 'title', 'Conflict candidate');
    const operation = store.getState().operationLog[0];
    const conflict = createManualConflict({
      id: 'conflict-1',
      operationId: operation?.id ?? '',
      recordId: 'rec-compliance-export',
      fieldId: 'title',
      localValue: 'Conflict candidate',
      remoteValue: 'Remote title',
      createdAt: '2026-05-23T10:00:11.000Z',
    });

    const reconciled = reconcileSyncResult(store.getState(), {
      acknowledgedOperationIds: [],
      conflicts: [conflict],
      remoteOperations: [],
      syncedAt: '2026-05-23T10:00:11.000Z',
    });

    expect(reconciled.operationLog[0]?.status).toBe('conflicted');
    expect(reconciled.conflicts[0]?.remoteValue).toBe('Remote title');
    expect(
      reconciled.records.find((record) => record.id === 'rec-compliance-export')?.cells.title,
    ).toBe('Conflict candidate');
  });

  it('replays typed remote operations against the shared document', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    const remoteOperation: RemoteWorkspaceOperation = {
      id: 'remote-op-1',
      clientId: 'remote-client',
      createdAt: '2026-05-23T10:00:11.000Z',
      status: 'acknowledged',
      type: 'cell.update',
      recordId: 'rec-compliance-export',
      fieldId: 'owner',
      before: 'Priya',
      after: 'Remote owner',
      baseVersion: 3,
    };

    const reconciled = reconcileSyncResult(store.getState(), {
      acknowledgedOperationIds: [],
      conflicts: [],
      remoteOperations: [remoteOperation],
      syncedAt: '2026-05-23T10:00:11.000Z',
    });

    expect(
      reconciled.records.find((record) => record.id === 'rec-compliance-export')?.cells.owner,
    ).toBe('Remote owner');
  });

  it('can resolve a conflict by accepting the remote value', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-compliance-export', 'title', 'Local title');
    store.getState().simulateRemoteConflict('rec-compliance-export', 'title', 'Remote title');

    const conflict = store.getState().conflicts[0];
    expect(conflict).toBeDefined();
    const resolved = resolveWorkspaceConflict(
      store.getState(),
      conflict?.id ?? '',
      'remote',
      '2026-05-23T10:00:12.000Z',
    );

    expect(resolved.conflicts[0]?.status).toBe('resolved');
    expect(resolved.operationLog[0]?.status).toBe('reverted');
    expect(
      resolved.records.find((record) => record.id === 'rec-compliance-export')?.cells.title,
    ).toBe('Remote title');
  });
});
