import type {
  FieldId,
  FieldValue,
  WorkspaceDocument,
  WorkspaceOperation,
  WorkbenchRecord,
  WorkspaceField,
} from '../model';

/** Applies a serializable operation to a workspace document without mutating inputs. */
export function applyOperation(
  document: WorkspaceDocument,
  operation: WorkspaceOperation,
): WorkspaceDocument {
  switch (operation.type) {
    case 'cell.update':
      return {
        ...document,
        records: updateRecordCell(
          document.records,
          operation.recordId,
          operation.fieldId,
          operation.after,
          operation.createdAt,
        ),
      };
    case 'record.status.move':
      return {
        ...document,
        records: updateRecordCell(
          document.records,
          operation.recordId,
          operation.statusFieldId,
          operation.after,
          operation.createdAt,
        ),
      };
    case 'column.resize':
      return {
        ...document,
        fields: resizeField(document.fields, operation.fieldId, operation.afterWidth),
      };
    case 'column.reorder':
      return {
        ...document,
        fieldOrder: [...operation.afterOrder],
      };
  }
}

/** Updates one cell and increments record version to support reconciliation decisions. */
export function updateRecordCell(
  records: readonly WorkbenchRecord[],
  recordId: string,
  fieldId: FieldId,
  value: FieldValue,
  updatedAt: string,
): WorkbenchRecord[] {
  return records.map((record) => {
    if (record.id !== recordId) {
      return record;
    }

    return {
      ...record,
      cells: {
        ...record.cells,
        [fieldId]: value,
      },
      updatedAt,
      version: record.version + 1,
    };
  });
}

/** Resizes one field while honoring the field minimum width. */
export function resizeField(
  fields: readonly WorkspaceField[],
  fieldId: FieldId,
  nextWidth: number,
): WorkspaceField[] {
  return fields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    return {
      ...field,
      width: Math.max(field.minWidth, Math.round(nextWidth)),
    };
  });
}

/** Moves one field to the target field index and preserves all other fields in order. */
export function reorderFields(
  fieldOrder: readonly FieldId[],
  fieldId: FieldId,
  targetFieldId: FieldId,
): FieldId[] {
  if (
    fieldId === targetFieldId ||
    !fieldOrder.includes(fieldId) ||
    !fieldOrder.includes(targetFieldId)
  ) {
    return [...fieldOrder];
  }

  const withoutSource = fieldOrder.filter((id) => id !== fieldId);
  const targetIndex = withoutSource.indexOf(targetFieldId);
  return [...withoutSource.slice(0, targetIndex), fieldId, ...withoutSource.slice(targetIndex)];
}

/** Replaces an operation status while keeping the log append-only and inspectable. */
export function markOperations(
  operations: readonly WorkspaceOperation[],
  operationIds: readonly string[],
  status: WorkspaceOperation['status'],
): WorkspaceOperation[] {
  const ids = new Set(operationIds);
  return operations.map((operation) =>
    ids.has(operation.id) ? { ...operation, status } : operation,
  );
}
