import {
  ArrowDownAZ,
  ArrowUpZA,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pencil,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  formatFieldValue,
  getCellValue,
  getOpenConflictsForCell,
  getOrderedFields,
  getPendingOperationsForCell,
  sortRecords,
} from '../../domain';
import type { FieldValue, WorkspaceField } from '../../model';
import { useWorkspaceSelector } from '../../state';

/** Dense table grid with inline editing, layout controls, selection, sorting, and keyboard navigation. */
export function DataGrid() {
  const fields = useWorkspaceSelector((store) => store.fields);
  const fieldOrder = useWorkspaceSelector((store) => store.fieldOrder);
  const records = useWorkspaceSelector((store) => store.records);
  const sort = useWorkspaceSelector((store) => store.sort);
  const selection = useWorkspaceSelector((store) => store.selection);
  const editingCell = useWorkspaceSelector((store) => store.editingCell);
  const conflicts = useWorkspaceSelector((store) => store.conflicts);
  const operationLog = useWorkspaceSelector((store) => store.operationLog);
  const selectCell = useWorkspaceSelector((store) => store.selectCell);
  const moveSelection = useWorkspaceSelector((store) => store.moveSelection);
  const startEditing = useWorkspaceSelector((store) => store.startEditing);
  const updateEditingDraft = useWorkspaceSelector((store) => store.updateEditingDraft);
  const cancelEditing = useWorkspaceSelector((store) => store.cancelEditing);
  const commitEditing = useWorkspaceSelector((store) => store.commitEditing);
  const toggleRecordSelection = useWorkspaceSelector((store) => store.toggleRecordSelection);
  const setSort = useWorkspaceSelector((store) => store.setSort);
  const resizeColumn = useWorkspaceSelector((store) => store.resizeColumn);
  const reorderColumn = useWorkspaceSelector((store) => store.reorderColumn);
  const [draftWidths, setDraftWidths] = useState<Readonly<Record<string, number>>>({});

  const orderedFields = useMemo(
    () => getOrderedFields({ fields, fieldOrder }),
    [fields, fieldOrder],
  );
  const sortedRecords = useMemo(() => sortRecords(records, sort), [records, sort]);

  useEffect(() => {
    if (editingCell) {
      return;
    }

    const target = document.querySelector<HTMLElement>(
      `[data-cell-id="${selection.selectedCell.recordId}:${selection.selectedCell.fieldId}"]`,
    );
    target?.focus();
  }, [editingCell, selection.selectedCell]);

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (editingCell) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveSelection(1, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveSelection(-1, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveSelection(0, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveSelection(0, -1);
        break;
      case 'Enter':
        event.preventDefault();
        startEditing();
        break;
      case 'Tab':
        event.preventDefault();
        moveSelection(0, event.shiftKey ? -1 : 1);
        break;
      default:
        break;
    }
  };

  const moveColumnLeft = (field: WorkspaceField): void => {
    const index = orderedFields.findIndex((candidate) => candidate.id === field.id);
    const target = orderedFields[index - 1];
    if (target) {
      void reorderColumn(field.id, target.id);
    }
  };

  const moveColumnRight = (field: WorkspaceField): void => {
    const index = orderedFields.findIndex((candidate) => candidate.id === field.id);
    const next = orderedFields[index + 1];
    if (next) {
      void reorderColumn(next.id, field.id);
    }
  };

  const beginColumnResize = (
    event: PointerEvent<HTMLButtonElement>,
    field: WorkspaceField,
  ): void => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = draftWidths[field.id] ?? field.width;

    const handleMove = (moveEvent: globalThis.PointerEvent): void => {
      setDraftWidths((current) => ({
        ...current,
        [field.id]: Math.max(field.minWidth, startWidth + moveEvent.clientX - startX),
      }));
    };

    const handleUp = (upEvent: globalThis.PointerEvent): void => {
      const nextWidth = Math.max(field.minWidth, startWidth + upEvent.clientX - startX);
      setDraftWidths((current) => {
        const next = { ...current };
        delete next[field.id];
        return next;
      });
      void resizeColumn(field.id, nextWidth);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  const handleColumnResizeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    field: WorkspaceField,
  ): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    void resizeColumn(field.id, field.width + direction * 16);
  };

  return (
    <section className="workspace-view" aria-label="Table view">
      <div className="grid-toolbar">
        <div>
          <strong>{sortedRecords.length}</strong> records
        </div>
        <div>
          <strong>{selection.selectedRecordIds.length}</strong> selected
        </div>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="empty-state" role="status">
          <strong>No records available</strong>
          <span>The shared workspace document is empty.</span>
        </div>
      ) : null}

      <div className="data-grid-shell" onKeyDown={handleGridKeyDown}>
        <table className="data-grid" role="grid" aria-rowcount={sortedRecords.length}>
          <thead>
            <tr>
              <th className="row-selector-header" scope="col" aria-label="Row selection" />
              {orderedFields.map((field, fieldIndex) => {
                const width = draftWidths[field.id] ?? field.width;
                const isSorted = sort?.fieldId === field.id;
                const isFirstColumn = fieldIndex === 0;
                const isLastColumn = fieldIndex === orderedFields.length - 1;

                return (
                  <th
                    key={field.id}
                    scope="col"
                    aria-sort={
                      isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    style={{ width, minWidth: field.minWidth }}
                  >
                    <div className="column-header">
                      <button
                        type="button"
                        className="column-title"
                        onClick={() => setSort(field.id)}
                        aria-label={`Sort by ${field.label}`}
                        title={`Sort by ${field.label}`}
                      >
                        <span>{field.label}</span>
                        {isSorted && sort.direction === 'asc' ? (
                          <ArrowDownAZ size={15} aria-hidden="true" />
                        ) : (
                          <ArrowUpZA size={15} aria-hidden="true" />
                        )}
                      </button>
                      <div className="column-actions" aria-label={`${field.label} column controls`}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => moveColumnLeft(field)}
                          aria-label={
                            isFirstColumn
                              ? `${field.label} is already the first column`
                              : `Move ${field.label} left`
                          }
                          title={
                            isFirstColumn
                              ? `${field.label} is already the first column`
                              : `Move ${field.label} left`
                          }
                          disabled={isFirstColumn}
                        >
                          <ChevronLeft size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => moveColumnRight(field)}
                          aria-label={
                            isLastColumn
                              ? `${field.label} is already the last column`
                              : `Move ${field.label} right`
                          }
                          title={
                            isLastColumn
                              ? `${field.label} is already the last column`
                              : `Move ${field.label} right`
                          }
                          disabled={isLastColumn}
                        >
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="resize-handle"
                          onPointerDown={(event) => beginColumnResize(event, field)}
                          onKeyDown={(event) => handleColumnResizeKeyDown(event, field)}
                          aria-label={`Resize ${field.label} with arrow keys`}
                          title={`Drag or use arrow keys to resize ${field.label}`}
                        >
                          <GripVertical size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => {
              const isSelectedRecord = selection.selectedRecordIds.includes(record.id);

              return (
                <tr key={record.id} aria-selected={isSelectedRecord}>
                  <td className="row-selector-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${formatFieldValue(getCellValue(record, 'title'))}`}
                      checked={isSelectedRecord}
                      onChange={() => toggleRecordSelection(record.id)}
                    />
                  </td>
                  {orderedFields.map((field) => {
                    const cell = { recordId: record.id, fieldId: field.id };
                    const value = getCellValue(record, field.id);
                    const selected =
                      selection.selectedCell.recordId === record.id &&
                      selection.selectedCell.fieldId === field.id;
                    const editing =
                      editingCell?.recordId === record.id && editingCell.fieldId === field.id;
                    const openConflicts = getOpenConflictsForCell(conflicts, cell);
                    const pendingOperations = getPendingOperationsForCell(operationLog, cell);

                    return (
                      <td
                        key={field.id}
                        role="gridcell"
                        tabIndex={selected && !editing ? 0 : -1}
                        aria-selected={selected}
                        data-cell-id={`${record.id}:${field.id}`}
                        data-testid={`grid-cell-${record.id}-${field.id}`}
                        className={[
                          selected ? 'is-selected' : '',
                          openConflicts.length > 0 ? 'has-conflict' : '',
                          pendingOperations.length > 0 ? 'has-pending' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onFocus={() => selectCell(cell)}
                        onClick={() => selectCell(cell)}
                        onDoubleClick={() => startEditing(cell)}
                      >
                        {editing ? (
                          <InlineEditor
                            value={editingCell.draftValue}
                            onChange={updateEditingDraft}
                            onCommit={() => {
                              void commitEditing();
                            }}
                            onCancel={cancelEditing}
                          />
                        ) : (
                          <CellDisplay field={field} value={value} />
                        )}
                        {pendingOperations.length > 0 ? (
                          <span className="cell-state-dot" aria-label="Pending operation" />
                        ) : null}
                        {openConflicts.length > 0 ? (
                          <TriangleAlert
                            className="cell-conflict-icon"
                            size={15}
                            aria-label="Conflict"
                          />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface InlineEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onCommit: () => void;
  readonly onCancel: () => void;
}

function InlineEditor({ value, onChange, onCommit, onCancel }: InlineEditorProps) {
  return (
    <input
      className="cell-editor"
      value={value}
      aria-label="Edit cell"
      autoFocus
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          onCommit();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
}

interface CellDisplayProps {
  readonly field: WorkspaceField;
  readonly value: FieldValue;
}

function CellDisplay({ field, value }: CellDisplayProps) {
  const formattedValue = formatFieldValue(value);
  const option = field.options?.find((candidate) => candidate.value === formattedValue);

  if (option) {
    return <span className={`value-pill value-pill-${option.tone}`}>{option.label}</span>;
  }

  if (field.type === 'date' && formattedValue) {
    return <time dateTime={formattedValue}>{formattedValue}</time>;
  }

  if (field.type === 'number' && formattedValue) {
    return <span className="numeric-cell">{formattedValue}d</span>;
  }

  return (
    <span className={formattedValue ? 'cell-text' : 'cell-empty'}>
      {formattedValue || 'Empty'}
      {formattedValue ? null : <Pencil size={13} aria-hidden="true" />}
    </span>
  );
}
