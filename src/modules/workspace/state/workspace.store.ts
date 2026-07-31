import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createInitialWorkspace } from '../data/initialWorkspace';
import {
  applyOperation,
  findField,
  findRecord,
  formatFieldValue,
  getCellValue,
  getNextCellAddress,
  getPendingOperationsForCell,
  parseFieldValue,
  sortRecords,
  WorkspaceOperationFactory,
} from '../domain';
import type {
  CellAddress,
  PersistedWorkspace,
  PresenceUser,
  RecordId,
  WorkspaceState,
  WorkspaceStore,
  WorkspaceDependencies,
} from '../model';
import {
  createManualConflict,
  DexieWorkspacePersistence,
  MockWorkspaceSyncService,
  reconcileSyncResult,
  resolveWorkspaceConflict,
} from '../services';

/** Bound Zustand hook returned by the workspace store factory. */
export type WorkspaceStoreHook = UseBoundStore<StoreApi<WorkspaceStore>>;

/** Converts a store state into the serializable persistence payload. */
function toPersistedWorkspace(state: WorkspaceState): PersistedWorkspace {
  return {
    fields: state.fields,
    fieldOrder: state.fieldOrder,
    records: state.records,
    operationLog: state.operationLog,
    conflicts: state.conflicts,
    sync: state.sync,
  };
}

/** Default services used by the browser app; tests inject deterministic mocks. */
function createDefaultWorkspaceDependencies(): WorkspaceDependencies {
  return {
    clientId: 'local-client',
    now: () => new Date().toISOString(),
    createId: (prefix) => `${prefix}-${createRandomId()}`,
    persistence: new DexieWorkspacePersistence(),
    syncService: new MockWorkspaceSyncService(),
  };
}

/** Creates an isolated workspace store with injected persistence and synchronization services. */
export function createWorkspaceStore(
  dependencies: WorkspaceDependencies = createDefaultWorkspaceDependencies(),
): WorkspaceStoreHook {
  const factory = new WorkspaceOperationFactory(dependencies);
  const initial = createInitialState(dependencies.now());

  const useStore = create<WorkspaceStore>()((set, get) => {
    const persist = async (): Promise<void> => {
      await dependencies.persistence.save(toPersistedWorkspace(get()));
    };

    const appendOperation = async (
      operation: ReturnType<
        | WorkspaceOperationFactory['createCellUpdate']
        | WorkspaceOperationFactory['createStatusMove']
        | WorkspaceOperationFactory['createColumnResize']
        | WorkspaceOperationFactory['createColumnReorder']
      >,
    ): Promise<void> => {
      const nextDocument = applyOperation(get(), operation);
      set((state) => {
        const operationLog = [...state.operationLog, operation];
        return {
          ...nextDocument,
          operationLog,
          sync: {
            ...state.sync,
            pendingCount: countPendingOperations(operationLog),
          },
        };
      });
      await persist();
    };

    return {
      ...initial,

      hydrate: async () => {
        const persisted = await dependencies.persistence.load();
        const workspace = persisted ?? createInitialWorkspace(dependencies.now());
        const selection = createInitialSelection(workspace);

        set({
          ...workspace,
          selection,
          activeView: 'table',
          editingCell: null,
          sort: null,
          commandPaletteOpen: false,
          sync: {
            ...workspace.sync,
            pendingCount: workspace.operationLog.filter(
              (operation) => operation.status === 'pending',
            ).length,
          },
          presence: createPresence(workspace, dependencies.now()),
          hydrated: true,
        });

        if (!persisted) {
          await persist();
        }
      },

      setActiveView: (view) => {
        set({ activeView: view });
      },

      selectCell: (cell) => {
        set((state) => ({
          selection: {
            ...state.selection,
            selectedCell: cell,
          },
        }));
      },

      moveSelection: (deltaRow, deltaColumn) => {
        set((state) => {
          const sortedDocument = {
            fields: state.fields,
            fieldOrder: state.fieldOrder,
            records: sortRecords(state.records, state.sort),
          };
          return {
            selection: {
              ...state.selection,
              selectedCell: getNextCellAddress(
                sortedDocument,
                state.selection.selectedCell,
                deltaRow,
                deltaColumn,
              ),
            },
          };
        });
      },

      toggleRecordSelection: (recordId) => {
        set((state) => {
          const selected = new Set(state.selection.selectedRecordIds);
          if (selected.has(recordId)) {
            selected.delete(recordId);
          } else {
            selected.add(recordId);
          }

          return {
            selection: {
              ...state.selection,
              selectedRecordIds: [...selected],
            },
          };
        });
      },

      startEditing: (cell) => {
        const state = get();
        const nextCell = cell ?? state.selection.selectedCell;
        const record = findRecord(state.records, nextCell.recordId);
        if (!record) {
          return;
        }

        set({
          selection: {
            ...state.selection,
            selectedCell: nextCell,
          },
          editingCell: {
            ...nextCell,
            draftValue: formatFieldValue(getCellValue(record, nextCell.fieldId)),
            originalValue: formatFieldValue(getCellValue(record, nextCell.fieldId)),
          },
        });
      },

      updateEditingDraft: (draftValue) => {
        set((state) => ({
          editingCell: state.editingCell ? { ...state.editingCell, draftValue } : null,
        }));
      },

      cancelEditing: () => {
        set({ editingCell: null });
      },

      commitEditing: async () => {
        const state = get();
        const editingCell = state.editingCell;
        if (!editingCell) {
          return;
        }

        const field = findField(state.fields, editingCell.fieldId);
        if (!field) {
          set({ editingCell: null });
          return;
        }

        set({ editingCell: null });
        await get().updateCell(
          editingCell.recordId,
          editingCell.fieldId,
          parseFieldValue(field, editingCell.draftValue),
        );
      },

      updateCell: async (recordId, fieldId, value) => {
        const state = get();
        const record = findRecord(state.records, recordId);
        if (!record || getCellValue(record, fieldId) === value) {
          return;
        }

        await appendOperation(factory.createCellUpdate(record, fieldId, value));
      },

      resizeColumn: async (fieldId, width) => {
        const field = findField(get().fields, fieldId);
        if (!field || Math.round(width) === field.width) {
          return;
        }

        await appendOperation(factory.createColumnResize(field, width));
      },

      reorderColumn: async (fieldId, targetFieldId) => {
        const state = get();
        if (fieldId === targetFieldId) {
          return;
        }

        const operation = factory.createColumnReorder(state.fieldOrder, fieldId, targetFieldId);
        if (operation.beforeOrder.join('|') === operation.afterOrder.join('|')) {
          return;
        }

        await appendOperation(operation);
      },

      setSort: (fieldId) => {
        set((state) => {
          if (state.sort?.fieldId !== fieldId) {
            return { sort: { fieldId, direction: 'asc' as const } };
          }

          if (state.sort.direction === 'asc') {
            return { sort: { fieldId, direction: 'desc' as const } };
          }

          return { sort: null };
        });
      },

      moveRecordToStatus: async (recordId, nextStatus) => {
        const state = get();
        const statusField = findField(state.fields, 'status');
        const record = findRecord(state.records, recordId);
        if (!statusField || !record || getCellValue(record, statusField.id) === nextStatus) {
          return;
        }

        await appendOperation(factory.createStatusMove(record, statusField.id, nextStatus));
      },

      flushSync: async () => {
        const state = get();
        const pendingOperations = state.operationLog.filter(
          (operation) => operation.status === 'pending',
        );
        if (pendingOperations.length === 0) {
          return;
        }

        set((current) => ({
          sync: {
            ...current.sync,
            mode: 'syncing',
            error: null,
          },
        }));

        try {
          const result = await dependencies.syncService.submitOperations(pendingOperations);
          const reconciled = reconcileSyncResult(get(), result);
          set(reconciled);
          await persist();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown sync failure';
          set((current) => ({
            sync: {
              ...current.sync,
              mode: 'error',
              error: message,
            },
          }));
        }
      },

      simulateRemoteConflict: (recordId, fieldId, remoteValue) => {
        const state = get();
        const record = findRecord(state.records, recordId);
        if (!record) {
          return;
        }

        const cell = { recordId, fieldId };
        const pendingOperation = getPendingOperationsForCell(state.operationLog, cell)[0];
        const operationId = pendingOperation?.id ?? dependencies.createId('remote-operation');
        const conflict = createManualConflict({
          id: dependencies.createId('conflict'),
          operationId,
          recordId,
          fieldId,
          localValue: getCellValue(record, fieldId),
          remoteValue,
          createdAt: dependencies.now(),
        });

        set((current) => {
          const operationLog = pendingOperation
            ? current.operationLog.map((operation) =>
                operation.id === pendingOperation.id
                  ? { ...operation, status: 'conflicted' as const }
                  : operation,
              )
            : current.operationLog;

          return {
            conflicts: [...current.conflicts, conflict],
            operationLog,
            sync: {
              ...current.sync,
              pendingCount: countPendingOperations(operationLog),
            },
          };
        });
      },

      resolveConflict: async (conflictId, resolution) => {
        const reconciled = resolveWorkspaceConflict(
          get(),
          conflictId,
          resolution,
          dependencies.now(),
        );
        set(reconciled);
        await persist();
      },

      setCommandPaletteOpen: (open) => {
        set({ commandPaletteOpen: open });
      },
    };
  });

  return useStore;
}

export const useWorkspaceStore = createWorkspaceStore();

function createInitialState(now: string): WorkspaceState {
  const workspace = createInitialWorkspace(now);
  return {
    ...workspace,
    activeView: 'table',
    selection: createInitialSelection(workspace),
    editingCell: null,
    sort: null,
    commandPaletteOpen: false,
    presence: createPresence(workspace, now),
    hydrated: false,
  };
}

function createInitialSelection(workspace: Pick<PersistedWorkspace, 'records' | 'fieldOrder'>): {
  readonly selectedCell: CellAddress;
  readonly selectedRecordIds: readonly RecordId[];
} {
  return {
    selectedCell: {
      recordId: workspace.records[0]?.id ?? '',
      fieldId: workspace.fieldOrder[0] ?? '',
    },
    selectedRecordIds: [],
  };
}

function createPresence(
  workspace: Pick<PersistedWorkspace, 'records' | 'fieldOrder'>,
  now: string,
): PresenceUser[] {
  const firstRecord = workspace.records[1] ?? workspace.records[0];
  const secondRecord = workspace.records[2] ?? workspace.records[0];
  const titleField = workspace.fieldOrder[0] ?? 'title';
  const statusField = workspace.fieldOrder[1] ?? titleField;

  return [
    {
      id: 'user-nora',
      name: 'Nora',
      color: '#2563eb',
      cursor: {
        recordId: firstRecord?.id ?? '',
        fieldId: titleField,
      },
      lastSeenAt: now,
    },
    {
      id: 'user-eli',
      name: 'Eli',
      color: '#059669',
      cursor: {
        recordId: secondRecord?.id ?? '',
        fieldId: statusField,
      },
      lastSeenAt: now,
    },
  ];
}

function createRandomId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function countPendingOperations(operations: WorkspaceState['operationLog']): number {
  return operations.filter((operation) => operation.status === 'pending').length;
}
