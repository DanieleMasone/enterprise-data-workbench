/** Unique identifier for a workspace field/column. */
export type FieldId = string;

/** Unique identifier for a row-level work item. */
export type RecordId = string;

/** Cell values are intentionally serializable so operations can be persisted and replayed. */
export type FieldValue = string | number | null;

/** Supported field kinds for the shared workbench record model. */
export type FieldType = 'text' | 'status' | 'date' | 'number' | 'owner' | 'priority';

/** Option metadata for categorical fields such as status and priority. */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

/** Column/field metadata used by every workspace view. */
export interface WorkspaceField {
  readonly id: FieldId;
  readonly label: string;
  readonly type: FieldType;
  readonly width: number;
  readonly minWidth: number;
  readonly options?: readonly FieldOption[];
}

/** The domain row object. Views derive their own presentation from this object. */
export interface WorkbenchRecord {
  readonly id: RecordId;
  readonly cells: Readonly<Record<FieldId, FieldValue>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

/** A small address object used for selection, editing, conflicts, and presence cursors. */
export interface CellAddress {
  readonly recordId: RecordId;
  readonly fieldId: FieldId;
}
