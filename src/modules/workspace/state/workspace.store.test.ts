import { describe, expect, it } from 'vitest';
import { createInitialWorkspace } from '../data/initialWorkspace';
import { createManualConflict } from '../services/reconciliation.service';
import { createTestWorkspaceStore } from '../test/createTestStore';

describe('workspace store', () => {
  it('hydrates from the seed document and persists the first local snapshot', async () => {
    const { store, persistence } = createTestWorkspaceStore();

    await store.getState().hydrate();

    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().records).toHaveLength(6);
    expect(persistence.savedSnapshots).toHaveLength(1);
  });

  it('hydrates persisted workspaces without replacing them with seed data', async () => {
    const seeded = createInitialWorkspace();
    const snapshot = {
      ...seeded,
      records: seeded.records.map((record, index) =>
        index === 0
          ? {
              ...record,
              cells: {
                ...record.cells,
                owner: 'Loaded owner',
              },
            }
          : record,
      ),
    };
    const { store, persistence } = createTestWorkspaceStore(snapshot);

    await store.getState().hydrate();

    expect(store.getState().records[0]?.cells.owner).toBe('Loaded owner');
    expect(persistence.savedSnapshots).toHaveLength(0);
  });

  it('commits cell edits optimistically and records pending operations', async () => {
    const { store, persistence } = createTestWorkspaceStore();
    await store.getState().hydrate();

    await store.getState().updateCell('rec-revenue-dashboard', 'owner', 'Sam');

    const updated = store
      .getState()
      .records.find((record) => record.id === 'rec-revenue-dashboard');
    expect(updated?.cells.owner).toBe('Sam');
    expect(store.getState().operationLog[0]?.status).toBe('pending');
    expect(store.getState().sync.pendingCount).toBe(1);
    expect(persistence.savedSnapshots.at(-1)?.records.find((record) => record.id === updated?.id)?.cells.owner).toBe(
      'Sam',
    );
  });

  it('supports inline editing commit and cancel flows', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    store.getState().startEditing({ recordId: 'rec-pricing-rules', fieldId: 'title' });
    store.getState().updateEditingDraft('Canceled title');
    store.getState().cancelEditing();

    expect(
      store.getState().records.find((record) => record.id === 'rec-pricing-rules')?.cells.title,
    ).toBe('Pricing rules review');

    store.getState().startEditing({ recordId: 'rec-pricing-rules', fieldId: 'title' });
    store.getState().updateEditingDraft('Committed title');
    await store.getState().commitEditing();

    expect(store.getState().editingCell).toBeNull();
    expect(
      store.getState().records.find((record) => record.id === 'rec-pricing-rules')?.cells.title,
    ).toBe('Committed title');
  });

  it('acknowledges optimistic updates through the sync boundary', async () => {
    const { store, syncService } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-customer-health', 'priority', 'High');

    await store.getState().flushSync();

    expect(syncService.submittedOperations).toHaveLength(1);
    expect(store.getState().operationLog[0]?.status).toBe('acknowledged');
    expect(store.getState().sync.pendingCount).toBe(0);
  });

  it('reconciles server conflicts without erasing the optimistic local value', async () => {
    const { store, syncService } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-analytics-migration', 'title', 'Local conflict title');
    const operation = store.getState().operationLog[0];
    expect(operation).toBeDefined();
    syncService.nextResult = {
      acknowledgedOperationIds: [],
      conflicts: [
        createManualConflict({
          id: 'conflict-1',
          operationId: operation?.id ?? '',
          recordId: 'rec-analytics-migration',
          fieldId: 'title',
          localValue: 'Local conflict title',
          remoteValue: 'Remote conflict title',
          createdAt: '2026-05-23T10:00:12.000Z',
        }),
      ],
      remoteOperations: [],
      syncedAt: '2026-05-23T10:00:12.000Z',
    };

    await store.getState().flushSync();

    expect(store.getState().operationLog[0]?.status).toBe('conflicted');
    expect(store.getState().conflicts[0]?.status).toBe('open');
    expect(store.getState().records[0]?.cells.title).toBe('Local conflict title');
  });

  it('moves kanban cards by writing a status operation against the shared record', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    await store.getState().moveRecordToStatus('rec-compliance-export', 'Delivery');

    expect(
      store.getState().records.find((record) => record.id === 'rec-compliance-export')?.cells.status,
    ).toBe('Delivery');
    expect(store.getState().operationLog[0]?.type).toBe('record.status.move');
  });

  it('models keyboard navigation and row selection explicitly', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    store.getState().moveSelection(1, 1);
    store.getState().toggleRecordSelection('rec-revenue-dashboard');

    expect(store.getState().selection.selectedCell).toEqual({
      recordId: 'rec-revenue-dashboard',
      fieldId: 'status',
    });
    expect(store.getState().selection.selectedRecordIds).toContain('rec-revenue-dashboard');
  });
});
