import Dexie, { type Table } from 'dexie';
import type { PersistedWorkspace } from '../model';

interface PersistedWorkspaceRecord extends PersistedWorkspace {
  readonly id: string;
}

class WorkspaceDatabase extends Dexie {
  workspaces!: Table<PersistedWorkspaceRecord, string>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(1).stores({
      workspaces: 'id',
    });
  }
}

/** Persistence boundary used by the store; production uses IndexedDB through Dexie. */
export interface WorkspacePersistence {
  readonly load: () => Promise<PersistedWorkspace | null>;
  readonly save: (workspace: PersistedWorkspace) => Promise<void>;
  readonly clear: () => Promise<void>;
}

/** Dexie-backed implementation for local-first workspace state. */
export class DexieWorkspacePersistence implements WorkspacePersistence {
  readonly #database: WorkspaceDatabase;
  readonly #workspaceId: string;

  constructor(databaseName = 'enterprise-data-workbench', workspaceId = 'default') {
    this.#database = new WorkspaceDatabase(databaseName);
    this.#workspaceId = workspaceId;
  }

  async load(): Promise<PersistedWorkspace | null> {
    const record = await this.#database.workspaces.get(this.#workspaceId);
    if (!record) {
      return null;
    }

    return {
      fields: record.fields,
      fieldOrder: record.fieldOrder,
      records: record.records,
      operationLog: record.operationLog,
      conflicts: record.conflicts,
      sync: record.sync,
    };
  }

  async save(workspace: PersistedWorkspace): Promise<void> {
    await this.#database.workspaces.put({
      id: this.#workspaceId,
      ...workspace,
    });
  }

  async clear(): Promise<void> {
    await this.#database.workspaces.delete(this.#workspaceId);
  }
}
