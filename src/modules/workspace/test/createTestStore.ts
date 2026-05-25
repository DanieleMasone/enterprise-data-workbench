import type {
  WorkspaceOperation,
  WorkspaceDocument,
  WorkspaceDependencies,
  PersistedWorkspace,
  SyncResult,
} from '../model';
import type { WorkspacePersistence, WorkspaceSyncService } from '../services';
import { createWorkspaceStore, type WorkspaceStoreHook } from '../state';

/** In-memory persistence test double that records every saved snapshot. */
export class InMemoryWorkspacePersistence implements WorkspacePersistence {
  savedSnapshots: PersistedWorkspace[] = [];
  #snapshot: PersistedWorkspace | null;

  constructor(snapshot: PersistedWorkspace | null = null) {
    this.#snapshot = snapshot ? cloneWorkspace(snapshot) : null;
  }

  async load(): Promise<PersistedWorkspace | null> {
    return this.#snapshot ? cloneWorkspace(this.#snapshot) : null;
  }

  async save(workspace: PersistedWorkspace): Promise<void> {
    this.#snapshot = cloneWorkspace(workspace);
    this.savedSnapshots.push(cloneWorkspace(workspace));
  }

  async clear(): Promise<void> {
    this.#snapshot = null;
  }
}

/** Deterministic sync test double with an overridable response factory. */
export class TestWorkspaceSyncService implements WorkspaceSyncService {
  submittedOperations: WorkspaceOperation[][] = [];
  nextResult: SyncResult | null = null;

  async submitOperations(
    operations: readonly WorkspaceOperation[],
    document: WorkspaceDocument,
  ): Promise<SyncResult> {
    void document;

    this.submittedOperations.push([...operations]);
    if (this.nextResult) {
      return this.nextResult;
    }

    return {
      acknowledgedOperationIds: operations.map((operation) => operation.id),
      conflicts: [],
      remoteOperations: [],
      syncedAt: '2026-05-23T10:00:00.000Z',
    };
  }
}

/** Creates a store with deterministic IDs, clocks, persistence, and sync. */
export function createTestWorkspaceStore(snapshot: PersistedWorkspace | null = null): {
  readonly store: WorkspaceStoreHook;
  readonly persistence: InMemoryWorkspacePersistence;
  readonly syncService: TestWorkspaceSyncService;
} {
  let id = 0;
  let tick = 0;
  const persistence = new InMemoryWorkspacePersistence(snapshot);
  const syncService = new TestWorkspaceSyncService();
  const dependencies: WorkspaceDependencies = {
    clientId: 'test-client',
    now: () => `2026-05-23T10:00:${String(tick++).padStart(2, '0')}.000Z`,
    createId: (prefix) => `${prefix}-${++id}`,
    persistence,
    syncService,
  };

  return {
    store: createWorkspaceStore(dependencies),
    persistence,
    syncService,
  };
}

function cloneWorkspace(workspace: PersistedWorkspace): PersistedWorkspace {
  return structuredClone(workspace) as PersistedWorkspace;
}
