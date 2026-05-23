import type { WorkspaceOperation } from '../model/operation.types';
import type { WorkspaceConflict, SyncResult } from '../model/sync.types';
import type { WorkspaceDocument } from '../model/workspace.types';

/** Synchronization boundary implemented by a mock service for local-first demos. */
export interface WorkspaceSyncService {
  readonly submitOperations: (
    operations: readonly WorkspaceOperation[],
    document: WorkspaceDocument,
  ) => Promise<SyncResult>;
}

/** Configuration for deterministic mock synchronization in app demos and tests. */
export interface MockSyncOptions {
  readonly delayMs?: number;
  readonly now?: () => string;
  readonly createId?: (prefix: string) => string;
}

/** Simulates a remote server that acknowledges operations and can produce deterministic conflicts. */
export class MockWorkspaceSyncService implements WorkspaceSyncService {
  readonly #delayMs: number;
  readonly #now: () => string;
  readonly #createId: (prefix: string) => string;

  constructor(options: MockSyncOptions = {}) {
    this.#delayMs = options.delayMs ?? 220;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#createId =
      options.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`);
  }

  async submitOperations(
    operations: readonly WorkspaceOperation[],
    document: WorkspaceDocument,
  ): Promise<SyncResult> {
    void document;

    if (this.#delayMs > 0) {
      await new Promise<void>((resolve) => {
        globalThis.setTimeout(resolve, this.#delayMs);
      });
    }

    const conflicts = operations.flatMap((operation) => this.createConflictForOperation(operation));
    const conflictedOperationIds = new Set(conflicts.map((conflict) => conflict.operationId));

    return {
      acknowledgedOperationIds: operations
        .filter((operation) => !conflictedOperationIds.has(operation.id))
        .map((operation) => operation.id),
      conflicts,
      remoteOperations: [],
      syncedAt: this.#now(),
    };
  }

  private createConflictForOperation(operation: WorkspaceOperation): WorkspaceConflict[] {
    if (operation.type !== 'cell.update' && operation.type !== 'record.status.move') {
      return [];
    }

    const nextValue = operation.after;
    if (typeof nextValue !== 'string' || !nextValue.toLowerCase().includes('conflict')) {
      return [];
    }

    const fieldId = operation.type === 'cell.update' ? operation.fieldId : operation.statusFieldId;
    return [
      {
        id: this.#createId('conflict'),
        operationId: operation.id,
        recordId: operation.recordId,
        fieldId,
        localValue: operation.after,
        remoteValue: operation.before,
        message: 'The mock server received a newer remote value for this cell.',
        status: 'open',
        createdAt: this.#now(),
      },
    ];
  }
}
