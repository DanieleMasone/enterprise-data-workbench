import type { FieldId, FieldValue, RecordId } from './record.types';

/** Operation lifecycle is visible so optimistic work never disappears into implicit state. */
export type OperationStatus = 'pending' | 'acknowledged' | 'conflicted' | 'reverted';

/** All operations carry enough metadata for persistence, replay, and inspection. */
export interface OperationEnvelope {
  readonly id: string;
  readonly clientId: string;
  readonly createdAt: string;
  readonly status: OperationStatus;
}

/** Optimistic cell edit with previous and next value for reconciliation. */
export interface CellUpdateOperation extends OperationEnvelope {
  readonly type: 'cell.update';
  readonly recordId: RecordId;
  readonly fieldId: FieldId;
  readonly before: FieldValue;
  readonly after: FieldValue;
  readonly baseVersion: number;
}

/** Domain-level status move used by kanban drag-and-drop and command handlers. */
export interface RecordStatusMoveOperation extends OperationEnvelope {
  readonly type: 'record.status.move';
  readonly recordId: RecordId;
  readonly statusFieldId: FieldId;
  readonly before: FieldValue;
  readonly after: FieldValue;
  readonly baseVersion: number;
}

/** Column resize operation persists user layout changes as first-class state. */
export interface ColumnResizeOperation extends OperationEnvelope {
  readonly type: 'column.resize';
  readonly fieldId: FieldId;
  readonly beforeWidth: number;
  readonly afterWidth: number;
}

/** Column reorder operation stores before/after field order for undo/replay foundations. */
export interface ColumnReorderOperation extends OperationEnvelope {
  readonly type: 'column.reorder';
  readonly fieldId: FieldId;
  readonly targetFieldId: FieldId;
  readonly beforeOrder: readonly FieldId[];
  readonly afterOrder: readonly FieldId[];
}

/** Every mutation that can be persisted or synchronized. */
export type WorkspaceOperation =
  | CellUpdateOperation
  | RecordStatusMoveOperation
  | ColumnResizeOperation
  | ColumnReorderOperation;

/** Remote operations reuse the same mutation grammar but are already reconciled. */
export type RemoteWorkspaceOperation = Omit<WorkspaceOperation, 'status'> & {
  readonly status: 'acknowledged';
};
