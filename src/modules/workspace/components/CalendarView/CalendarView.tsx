import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatFieldValue,
  getCellValue,
  groupRecordsByDate,
  sortRecords,
} from '../../domain/workspaceSelectors';
import { useWorkspaceSelector } from '../../state/WorkspaceStoreProvider';

/** Calendar projection that groups the shared records by their due date field. */
export function CalendarView() {
  const records = useWorkspaceSelector((store) => store.records);
  const sort = useWorkspaceSelector((store) => store.sort);
  const sortedRecords = useMemo(() => sortRecords(records, sort), [records, sort]);
  const groups = useMemo(() => groupRecordsByDate(sortedRecords, 'dueDate'), [sortedRecords]);
  const sortedDates = Object.keys(groups).sort();

  return (
    <section className="workspace-view" aria-label="Calendar view">
      <div className="calendar-board">
        {sortedDates.map((date) => (
          <section key={date} className="calendar-day" aria-label={date}>
            <header>
              <CalendarDays size={18} aria-hidden="true" />
              <h2>{date}</h2>
              <strong>{groups[date]?.length ?? 0}</strong>
            </header>
            <div className="calendar-items">
              {(groups[date] ?? []).map((record) => (
                <article key={record.id} className="calendar-item">
                  <h3>{formatFieldValue(getCellValue(record, 'title'))}</h3>
                  <p>
                    {formatFieldValue(getCellValue(record, 'owner'))} -{' '}
                    {formatFieldValue(getCellValue(record, 'status'))}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
