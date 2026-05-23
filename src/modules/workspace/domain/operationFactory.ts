import type {
  CellUpdateOperation,
  ColumnReorderOperation,
  ColumnResizeOperation,
  OperationEnvelope,
  RecordStatusMoveOperation,
} from '../model/operation.types';
import type { FieldId, FieldValue, WorkbenchRecord, WorkspaceField } from '../model/record.types';
import { getCellValue } from './workspaceSelectors';
import { reorderFields } from './workspaceMutations';

/** Runtime metadata needed to create persisted workspace operations. */
export interface OperationFactoryContext {
  readonly clientId: string;
  readonly createId: (prefix: string) => string;
  readonly now: () => string;
}

/** Creates operation envelopes consistently for persistence and sync replay. */
export class WorkspaceOperationFactory {
  readonly #context: OperationFactoryContext;

  constructor(context: OperationFactoryContext) {
    this.#context = context;
  }

  /** Builds an optimistic cell edit operation from the current record value. */
  createCellUpdate(
    record: WorkbenchRecord,
    fieldId: FieldId,
    after: FieldValue,
  ): CellUpdateOperation {
    return {
      ...this.createEnvelope('op-cell'),
      type: 'cell.update',
      recordId: record.id,
      fieldId,
      before: getCellValue(record, fieldId),
      after,
      baseVersion: record.version,
    };
  }

  /** Builds a kanban status movement operation. */
  createStatusMove(
    record: WorkbenchRecord,
    statusFieldId: FieldId,
    after: FieldValue,
  ): RecordStatusMoveOperation {
    return {
      ...this.createEnvelope('op-status'),
      type: 'record.status.move',
      recordId: record.id,
      statusFieldId,
      before: getCellValue(record, statusFieldId),
      after,
      baseVersion: record.version,
    };
  }

  /** Builds a layout operation for column resizing. */
  createColumnResize(field: WorkspaceField, width: number): ColumnResizeOperation {
    return {
      ...this.createEnvelope('op-width'),
      type: 'column.resize',
      fieldId: field.id,
      beforeWidth: field.width,
      afterWidth: Math.max(field.minWidth, Math.round(width)),
    };
  }

  /** Builds a column reorder operation with a complete before/after order snapshot. */
  createColumnReorder(
    fieldOrder: readonly FieldId[],
    fieldId: FieldId,
    targetFieldId: FieldId,
  ): ColumnReorderOperation {
    return {
      ...this.createEnvelope('op-column'),
      type: 'column.reorder',
      fieldId,
      targetFieldId,
      beforeOrder: [...fieldOrder],
      afterOrder: reorderFields(fieldOrder, fieldId, targetFieldId),
    };
  }

  private createEnvelope(prefix: string): OperationEnvelope {
    return {
      id: this.#context.createId(prefix),
      clientId: this.#context.clientId,
      createdAt: this.#context.now(),
      status: 'pending',
    };
  }
}
