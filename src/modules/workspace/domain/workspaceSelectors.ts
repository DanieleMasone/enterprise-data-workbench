import type {
  CellAddress,
  FieldId,
  FieldValue,
  RecordId,
  SortState,
  WorkspaceConflict,
  WorkspaceDocument,
  WorkspaceOperation,
  WorkbenchRecord,
  WorkspaceField,
} from '../model';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Returns fields in user-controlled order while keeping field metadata immutable. */
export function getOrderedFields(
  document: Pick<WorkspaceDocument, 'fields' | 'fieldOrder'>,
): WorkspaceField[] {
  const fieldById = new Map(document.fields.map((field) => [field.id, field]));
  return document.fieldOrder.flatMap((fieldId) => {
    const field = fieldById.get(fieldId);
    return field ? [field] : [];
  });
}

/** Reads a cell value without leaking undefined into rendering and command logic. */
export function getCellValue(record: WorkbenchRecord, fieldId: FieldId): FieldValue {
  return record.cells[fieldId] ?? null;
}

/** Converts raw editor text to the field's domain value. */
export function parseFieldValue(field: WorkspaceField, value: string): FieldValue {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (field.type === 'number') {
    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? numericValue : getNumberFallback(value);
  }

  return trimmed;
}

/** Formats cell values for compact table, kanban, and calendar display. */
export function formatFieldValue(value: FieldValue): string {
  return value === null ? '' : String(value);
}

/** Applies workspace sort without mutating the source record collection. */
export function sortRecords(
  records: readonly WorkbenchRecord[],
  sort: SortState | null,
): WorkbenchRecord[] {
  if (!sort) {
    return [...records];
  }

  return [...records].sort((left, right) => {
    const leftValue = getCellValue(left, sort.fieldId);
    const rightValue = getCellValue(right, sort.fieldId);
    const comparison = compareFieldValues(leftValue, rightValue);
    return sort.direction === 'asc' ? comparison : comparison * -1;
  });
}

/** Finds the next valid cell address for keyboard navigation. */
export function getNextCellAddress(
  document: WorkspaceDocument,
  current: CellAddress,
  deltaRow: number,
  deltaColumn: number,
): CellAddress {
  const orderedFields = getOrderedFields(document);
  const rowIndex = document.records.findIndex((record) => record.id === current.recordId);
  const columnIndex = orderedFields.findIndex((field) => field.id === current.fieldId);
  const nextRowIndex = clampIndex(rowIndex + deltaRow, document.records.length);
  const nextColumnIndex = clampIndex(columnIndex + deltaColumn, orderedFields.length);

  return {
    recordId: document.records[nextRowIndex]?.id ?? current.recordId,
    fieldId: orderedFields[nextColumnIndex]?.id ?? current.fieldId,
  };
}

/** Locates the record backing a cell selection or operation. */
export function findRecord(
  records: readonly WorkbenchRecord[],
  recordId: RecordId,
): WorkbenchRecord | null {
  return records.find((record) => record.id === recordId) ?? null;
}

/** Locates field metadata for parsing, sorting, and rendering controls. */
export function findField(
  fields: readonly WorkspaceField[],
  fieldId: FieldId,
): WorkspaceField | null {
  return fields.find((field) => field.id === fieldId) ?? null;
}

/** Returns open conflicts scoped to a single cell for fast indicator rendering. */
export function getOpenConflictsForCell(
  conflicts: readonly WorkspaceConflict[],
  cell: CellAddress,
): WorkspaceConflict[] {
  return conflicts.filter(
    (conflict) =>
      conflict.status === 'open' &&
      conflict.recordId === cell.recordId &&
      conflict.fieldId === cell.fieldId,
  );
}

/** Returns pending operations that are relevant to a record or a specific cell. */
export function getPendingOperationsForCell(
  operations: readonly WorkspaceOperation[],
  cell: CellAddress,
): WorkspaceOperation[] {
  return operations.filter((operation) => {
    if (operation.status !== 'pending') {
      return false;
    }

    if (operation.type === 'cell.update') {
      return operation.recordId === cell.recordId && operation.fieldId === cell.fieldId;
    }

    if (operation.type === 'record.status.move') {
      return operation.recordId === cell.recordId && operation.statusFieldId === cell.fieldId;
    }

    return false;
  });
}

/** Projects records into kanban columns using the shared status field. */
export function groupRecordsByStatus(
  records: readonly WorkbenchRecord[],
  statusField: WorkspaceField,
): Readonly<Record<string, WorkbenchRecord[]>> {
  const groups: Record<string, WorkbenchRecord[]> = {};
  statusField.options?.forEach((option) => {
    groups[option.value] = [];
  });

  records.forEach((record) => {
    const status = formatFieldValue(getCellValue(record, statusField.id)) || 'Unassigned';
    groups[status] = [...(groups[status] ?? []), record];
  });

  return groups;
}

/** Projects records into dated buckets for the calendar view. */
export function groupRecordsByDate(
  records: readonly WorkbenchRecord[],
  dateFieldId: FieldId,
): Readonly<Record<string, WorkbenchRecord[]>> {
  return records.reduce<Record<string, WorkbenchRecord[]>>((groups, record) => {
    const rawDate = formatFieldValue(getCellValue(record, dateFieldId)) || 'Unscheduled';
    groups[rawDate] = [...(groups[rawDate] ?? []), record];
    return groups;
  }, {});
}

function compareFieldValues(leftValue: FieldValue, rightValue: FieldValue): number {
  if (leftValue === rightValue) {
    return 0;
  }
  if (leftValue === null) {
    return 1;
  }
  if (rightValue === null) {
    return -1;
  }
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }
  return collator.compare(String(leftValue), String(rightValue));
}

function getNumberFallback(value: string): string {
  return value.trim();
}

function clampIndex(index: number, length: number): number {
  if (length === 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}
