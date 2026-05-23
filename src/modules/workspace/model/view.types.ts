import type { CellAddress, FieldId, RecordId } from './record.types';

/** Workspace modes share a document and only change how records are projected. */
export type WorkspaceViewMode = 'table' | 'kanban' | 'calendar';

/** Sorting is modeled in the workspace state because every view can respect it. */
export interface SortState {
  readonly fieldId: FieldId;
  readonly direction: 'asc' | 'desc';
}

/** Explicit row and cell selection prevents hidden coupling between grid widgets. */
export interface WorkspaceSelection {
  readonly selectedCell: CellAddress;
  readonly selectedRecordIds: readonly RecordId[];
}

/** Inline editing is a state transition with a draft value and original value. */
export interface EditingCellState extends CellAddress {
  readonly draftValue: string;
  readonly originalValue: string;
}

/** Command palette entries can invoke domain commands or UI mode switches. */
export interface WorkspaceCommand {
  readonly id: string;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly execute: () => void | Promise<void>;
}
