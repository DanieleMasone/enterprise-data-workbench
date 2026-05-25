import { Check, RefreshCw, RotateCcw, ServerCog, TriangleAlert } from 'lucide-react';
import { useCallback } from 'react';
import { formatFieldValue } from '../../domain';
import { useOptimisticMutation } from '../../hooks';
import { useWorkspaceSelector } from '../../state';

/** Inspector for explicit sync state, pending operations, and conflict resolution. */
export function SyncInspector() {
  const sync = useWorkspaceSelector((store) => store.sync);
  const operationLog = useWorkspaceSelector((store) => store.operationLog);
  const conflicts = useWorkspaceSelector((store) => store.conflicts);
  const flushSync = useWorkspaceSelector((store) => store.flushSync);
  const resolveConflict = useWorkspaceSelector((store) => store.resolveConflict);
  const selectedCell = useWorkspaceSelector((store) => store.selection.selectedCell);
  const simulateRemoteConflict = useWorkspaceSelector((store) => store.simulateRemoteConflict);
  const syncMutation = useOptimisticMutation(useCallback(() => flushSync(), [flushSync]));
  const pendingOperations = operationLog.filter((operation) => operation.status === 'pending');
  const recentOperations = operationLog.slice(-6).reverse();
  const openConflicts = conflicts.filter((conflict) => conflict.status === 'open');

  return (
    <aside className="sync-inspector" aria-label="Sync inspector">
      <p className="sr-only" aria-live="polite">
        Sync status is {sync.mode}. {pendingOperations.length} pending operations and{' '}
        {openConflicts.length} open conflicts.
      </p>
      <header>
        <ServerCog size={19} aria-hidden="true" />
        <div>
          <h2>Sync</h2>
          <p>{sync.mode}</p>
        </div>
      </header>

      <div className="sync-metrics">
        <div>
          <span>Pending</span>
          <strong>{pendingOperations.length}</strong>
        </div>
        <div>
          <span>Conflicts</span>
          <strong>{openConflicts.length}</strong>
        </div>
      </div>

      <div className="sync-actions">
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            void syncMutation.run();
          }}
          disabled={syncMutation.isPending || pendingOperations.length === 0}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Sync
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() =>
            simulateRemoteConflict(
              selectedCell.recordId,
              selectedCell.fieldId,
              'Remote collaborator value',
            )
          }
        >
          <TriangleAlert size={15} aria-hidden="true" />
          Conflict
        </button>
      </div>

      {sync.error || syncMutation.error ? (
        <p className="sync-error">{sync.error ?? syncMutation.error}</p>
      ) : null}

      <section className="inspector-section" aria-label="Pending operations">
        <h3>Pending operations</h3>
        {pendingOperations.length === 0 ? <p className="muted">No pending operations</p> : null}
        <ol className="operation-list">
          {pendingOperations.slice(-5).map((operation) => (
            <li key={operation.id}>
              <span>{operation.type}</span>
              <code>{operation.id}</code>
            </li>
          ))}
        </ol>
      </section>

      <section className="inspector-section" aria-label="Operation log">
        <h3>Operation log</h3>
        {recentOperations.length === 0 ? <p className="muted">No operations recorded yet</p> : null}
        <ol className="operation-list">
          {recentOperations.map((operation) => (
            <li key={operation.id}>
              <span>{operation.type}</span>
              <code>{operation.status}</code>
            </li>
          ))}
        </ol>
      </section>

      <section className="inspector-section" aria-label="Conflicts">
        <h3>Conflicts</h3>
        {openConflicts.length === 0 ? <p className="muted">No open conflicts</p> : null}
        <ol className="conflict-list">
          {openConflicts.map((conflict) => (
            <li key={conflict.id}>
              <p>{conflict.message}</p>
              <dl>
                <div>
                  <dt>Local</dt>
                  <dd>{formatFieldValue(conflict.localValue) || 'Empty'}</dd>
                </div>
                <div>
                  <dt>Remote</dt>
                  <dd>{formatFieldValue(conflict.remoteValue) || 'Empty'}</dd>
                </div>
              </dl>
              <div className="conflict-actions">
                <button
                  type="button"
                  onClick={() => {
                    void resolveConflict(conflict.id, 'local');
                  }}
                >
                  <Check size={14} aria-hidden="true" />
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void resolveConflict(conflict.id, 'remote');
                  }}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Remote
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
