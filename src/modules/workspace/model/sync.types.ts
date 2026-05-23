import type { FieldId, FieldValue, RecordId } from './record.types';
import type { WorkbenchRecord, WorkspaceField } from './record.types';
import type { RemoteWorkspaceOperation, WorkspaceOperation } from './operation.types';

/** Remote presence users expose a cursor without requiring a real collaboration backend. */
export interface PresenceUser {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly cursor: {
    readonly recordId: RecordId;
    readonly fieldId: FieldId;
  };
  readonly lastSeenAt: string;
}

/** Conflict records are separate from operations so the UI can resolve them explicitly. */
export interface WorkspaceConflict {
  readonly id: string;
  readonly operationId: string;
  readonly recordId: RecordId;
  readonly fieldId: FieldId;
  readonly localValue: FieldValue;
  readonly remoteValue: FieldValue;
  readonly message: string;
  readonly status: 'open' | 'resolved';
  readonly createdAt: string;
}

/** High-level sync health shown in the inspector and persisted with the workspace. */
export interface SyncStatus {
  readonly mode: 'idle' | 'syncing' | 'offline' | 'error';
  readonly pendingCount: number;
  readonly lastSyncedAt: string | null;
  readonly error: string | null;
}

/** Result returned by the mock synchronization service. */
export interface SyncResult {
  readonly acknowledgedOperationIds: readonly string[];
  readonly conflicts: readonly WorkspaceConflict[];
  readonly remoteOperations: readonly RemoteWorkspaceOperation[];
  readonly syncedAt: string;
}

/** Serializable workspace state at the persistence boundary. */
export interface PersistedWorkspace {
  readonly fields: readonly WorkspaceField[];
  readonly fieldOrder: readonly FieldId[];
  readonly records: readonly WorkbenchRecord[];
  readonly operationLog: readonly WorkspaceOperation[];
  readonly conflicts: readonly WorkspaceConflict[];
  readonly sync: SyncStatus;
}
