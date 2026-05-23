import type { WorkspaceOperation } from '../model/operation.types';
import type { FieldValue } from '../model/record.types';
import type { SyncResult, WorkspaceConflict } from '../model/sync.types';
import type { WorkspaceState } from '../model/workspace.types';
import { applyOperation, markOperations, updateRecordCell } from '../domain/workspaceMutations';

/** Reconciliation output contains only the state slices affected by sync decisions. */
export interface ReconciledWorkspace {
  readonly records: WorkspaceState['records'];
  readonly fields: WorkspaceState['fields'];
  readonly fieldOrder: WorkspaceState['fieldOrder'];
  readonly operationLog: WorkspaceState['operationLog'];
  readonly conflicts: WorkspaceState['conflicts'];
  readonly sync: WorkspaceState['sync'];
}

/** Applies server acknowledgements, remote operations, and conflicts to local optimistic state. */
export function reconcileSyncResult(
  state: WorkspaceState,
  result: SyncResult,
): ReconciledWorkspace {
  const conflictOperationIds = result.conflicts.map((conflict) => conflict.operationId);
  const acknowledgedLog = markOperations(
    state.operationLog,
    result.acknowledgedOperationIds,
    'acknowledged',
  );
  const operationLog = markOperations(acknowledgedLog, conflictOperationIds, 'conflicted');
  const mergedConflicts = mergeConflicts(state.conflicts, result.conflicts);

  const remoteDocument = result.remoteOperations.reduce(
    (document, operation) => applyOperation(document, operation as WorkspaceOperation),
    {
      fields: state.fields,
      fieldOrder: state.fieldOrder,
      records: state.records,
    },
  );

  return {
    ...remoteDocument,
    operationLog,
    conflicts: mergedConflicts,
    sync: {
      mode: 'idle',
      pendingCount: operationLog.filter((operation) => operation.status === 'pending').length,
      lastSyncedAt: result.syncedAt,
      error: null,
    },
  };
}

/** Resolves an open conflict by keeping the optimistic value or accepting the remote value. */
export function resolveWorkspaceConflict(
  state: WorkspaceState,
  conflictId: string,
  resolution: 'local' | 'remote',
  resolvedAt: string,
): ReconciledWorkspace {
  const conflict = state.conflicts.find((candidate) => candidate.id === conflictId);
  if (!conflict || conflict.status === 'resolved') {
    return {
      records: state.records,
      fields: state.fields,
      fieldOrder: state.fieldOrder,
      operationLog: state.operationLog,
      conflicts: state.conflicts,
      sync: state.sync,
    };
  }

  const nextRecords =
    resolution === 'remote'
      ? updateRecordCell(
          state.records,
          conflict.recordId,
          conflict.fieldId,
          conflict.remoteValue,
          resolvedAt,
        )
      : state.records;

  const nextOperationStatus = resolution === 'remote' ? 'reverted' : 'acknowledged';
  const operationLog = markOperations(state.operationLog, [conflict.operationId], nextOperationStatus);
  const conflicts = state.conflicts.map((candidate) =>
    candidate.id === conflictId ? { ...candidate, status: 'resolved' as const } : candidate,
  );

  return {
    records: nextRecords,
    fields: state.fields,
    fieldOrder: state.fieldOrder,
    operationLog,
    conflicts,
    sync: {
      ...state.sync,
      pendingCount: operationLog.filter((operation) => operation.status === 'pending').length,
      lastSyncedAt: resolvedAt,
    },
  };
}

/** Creates a conflict from a visible remote update so demos can exercise reconciliation instantly. */
export function createManualConflict(args: {
  readonly id: string;
  readonly operationId: string;
  readonly recordId: string;
  readonly fieldId: string;
  readonly localValue: FieldValue;
  readonly remoteValue: FieldValue;
  readonly createdAt: string;
}): WorkspaceConflict {
  return {
    id: args.id,
    operationId: args.operationId,
    recordId: args.recordId,
    fieldId: args.fieldId,
    localValue: args.localValue,
    remoteValue: args.remoteValue,
    message: 'A simulated collaborator changed this cell before the local edit synchronized.',
    status: 'open',
    createdAt: args.createdAt,
  };
}

function mergeConflicts(
  existingConflicts: readonly WorkspaceConflict[],
  incomingConflicts: readonly WorkspaceConflict[],
): WorkspaceConflict[] {
  const existingIds = new Set(existingConflicts.map((conflict) => conflict.id));
  return [
    ...existingConflicts,
    ...incomingConflicts.filter((conflict) => !existingIds.has(conflict.id)),
  ];
}
