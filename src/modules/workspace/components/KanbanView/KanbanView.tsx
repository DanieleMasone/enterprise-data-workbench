import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import {
  findField,
  formatFieldValue,
  getCellValue,
  groupRecordsByStatus,
  sortRecords,
} from '../../domain/workspaceSelectors';
import type { FieldOption, WorkbenchRecord } from '../../model/record.types';
import { useWorkspaceSelector } from '../../state/WorkspaceStoreProvider';

/** Kanban projection of the shared record model with domain-level status movement. */
export function KanbanView() {
  const fields = useWorkspaceSelector((store) => store.fields);
  const records = useWorkspaceSelector((store) => store.records);
  const sort = useWorkspaceSelector((store) => store.sort);
  const moveRecordToStatus = useWorkspaceSelector((store) => store.moveRecordToStatus);
  const statusField = findField(fields, 'status');
  const sortedRecords = useMemo(() => sortRecords(records, sort), [records, sort]);
  const groups = useMemo(
    () => (statusField ? groupRecordsByStatus(sortedRecords, statusField) : {}),
    [sortedRecords, statusField],
  );

  if (!statusField?.options) {
    return <section className="workspace-view">Status field is not configured.</section>;
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const recordId = event.active.data.current?.recordId;
    const nextStatus = event.over?.id;
    if (typeof recordId === 'string' && typeof nextStatus === 'string') {
      void moveRecordToStatus(recordId, nextStatus);
    }
  };

  return (
    <section className="workspace-view" aria-label="Kanban view">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {statusField.options.map((option) => (
            <KanbanColumn
              key={option.value}
              option={option}
              records={groups[option.value] ?? []}
              allOptions={statusField.options ?? []}
              onMove={(recordId, status) => {
                void moveRecordToStatus(recordId, status);
              }}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}

interface KanbanColumnProps {
  readonly option: FieldOption;
  readonly records: readonly WorkbenchRecord[];
  readonly allOptions: readonly FieldOption[];
  readonly onMove: (recordId: string, status: string) => void;
}

function KanbanColumn({ option, records, allOptions, onMove }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: option.value });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'is-over' : ''}`}
      aria-label={`${option.label} column`}
    >
      <header className="kanban-column-header">
        <span className={`value-pill value-pill-${option.tone}`}>{option.label}</span>
        <strong>{records.length}</strong>
      </header>
      <div className="kanban-column-list">
        {records.length === 0 ? <p className="empty-column">No records in this status</p> : null}
        {records.map((record) => (
          <KanbanCard
            key={record.id}
            record={record}
            allOptions={allOptions}
            currentStatus={option.value}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}

interface KanbanCardProps {
  readonly record: WorkbenchRecord;
  readonly allOptions: readonly FieldOption[];
  readonly currentStatus: string;
  readonly onMove: (recordId: string, status: string) => void;
}

function KanbanCard({ record, allOptions, currentStatus, onMove }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    data: { recordId: record.id },
  });
  const nextOption = allOptions.find((option) => option.value !== currentStatus);
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <article
      ref={setNodeRef}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      <h3>{formatFieldValue(getCellValue(record, 'title'))}</h3>
      <dl>
        <div>
          <dt>Owner</dt>
          <dd>{formatFieldValue(getCellValue(record, 'owner'))}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{formatFieldValue(getCellValue(record, 'dueDate'))}</dd>
        </div>
      </dl>
      {nextOption ? (
        <button
          type="button"
          className="inline-action"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onMove(record.id, nextOption.value)}
          aria-label={`Move ${formatFieldValue(getCellValue(record, 'title'))} to ${nextOption.label}`}
        >
          <ArrowRight size={14} aria-hidden="true" />
          {nextOption.label}
        </button>
      ) : null}
    </article>
  );
}
