import type { WorkspaceOperation } from './operation.types';
import type { PresenceUser, SyncStatus, WorkspaceConflict } from './sync.types';
import type { WorkspacePersistence, WorkspaceSyncService } from '../services';
import type {
  CellAddress,
  FieldId,
  FieldValue,
  RecordId,
  WorkbenchRecord,
  WorkspaceField,
} from './record.types';
import type {
  EditingCellState,
  SortState,
  WorkspaceSelection,
  WorkspaceViewMode,
} from './view.types';

/** Shared document state consumed by table, kanban, and calendar projections. */
export interface WorkspaceDocument {
  readonly fields: readonly WorkspaceField[];
  readonly fieldOrder: readonly FieldId[];
  readonly records: readonly WorkbenchRecord[];
}

/** Interactive state is explicit but remains derived from the shared document. */
export interface WorkspaceInteractionState {
  readonly activeView: WorkspaceViewMode;
  readonly selection: WorkspaceSelection;
  readonly editingCell: EditingCellState | null;
  readonly sort: SortState | null;
  readonly commandPaletteOpen: boolean;
}

/** Complete workspace store state exposed to React components and tests. */
export interface WorkspaceState extends WorkspaceDocument, WorkspaceInteractionState {
  readonly operationLog: readonly WorkspaceOperation[];
  readonly conflicts: readonly WorkspaceConflict[];
  readonly sync: SyncStatus;
  readonly presence: readonly PresenceUser[];
  readonly hydrated: boolean;
}

/** Async dependencies are injected so tests can assert persistence and sync boundaries. */
export interface WorkspaceDependencies {
  readonly clientId: string;
  readonly now: () => string;
  readonly createId: (prefix: string) => string;
  readonly persistence: WorkspacePersistence;
  readonly syncService: WorkspaceSyncService;
}

/** Commands are the only supported mutation surface for workspace state. */
export interface WorkspaceActions {
  readonly hydrate: () => Promise<void>;
  readonly setActiveView: (view: WorkspaceViewMode) => void;
  readonly selectCell: (cell: CellAddress) => void;
  readonly moveSelection: (deltaRow: number, deltaColumn: number) => void;
  readonly toggleRecordSelection: (recordId: RecordId) => void;
  readonly startEditing: (cell?: CellAddress) => void;
  readonly updateEditingDraft: (draftValue: string) => void;
  readonly cancelEditing: () => void;
  readonly commitEditing: () => Promise<void>;
  readonly updateCell: (recordId: RecordId, fieldId: FieldId, value: FieldValue) => Promise<void>;
  readonly resizeColumn: (fieldId: FieldId, width: number) => Promise<void>;
  readonly reorderColumn: (fieldId: FieldId, targetFieldId: FieldId) => Promise<void>;
  readonly setSort: (fieldId: FieldId) => void;
  readonly moveRecordToStatus: (recordId: RecordId, nextStatus: FieldValue) => Promise<void>;
  readonly flushSync: () => Promise<void>;
  readonly simulateRemoteConflict: (
    recordId: RecordId,
    fieldId: FieldId,
    remoteValue: FieldValue,
  ) => void;
  readonly resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>;
  readonly setCommandPaletteOpen: (open: boolean) => void;
}

/** Zustand store shape used by the provider and component selectors. */
export type WorkspaceStore = WorkspaceState & WorkspaceActions;
