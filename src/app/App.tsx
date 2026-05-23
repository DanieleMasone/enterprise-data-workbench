import { CalendarDays, Columns3, Command, LayoutGrid, Table2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import {
  CalendarView,
  CommandPalette,
  DataGrid,
  KanbanView,
  PresenceLayer,
  SyncInspector,
} from '../modules/workspace/components';
import { useKeyboardShortcuts } from '../modules/workspace/hooks';
import { WorkspaceStoreProvider, useWorkspaceSelector } from '../modules/workspace/state';
import type { WorkspaceViewMode } from '../modules/workspace/model';

const viewLabels: Readonly<Record<WorkspaceViewMode, string>> = {
  table: 'Table',
  kanban: 'Kanban',
  calendar: 'Calendar',
};

/** Root application shell for the enterprise data workbench. */
export function App() {
  return (
    <WorkspaceStoreProvider>
      <WorkspaceApplication />
    </WorkspaceStoreProvider>
  );
}

function WorkspaceApplication() {
  const hydrate = useWorkspaceSelector((store) => store.hydrate);
  const hydrated = useWorkspaceSelector((store) => store.hydrated);
  const activeView = useWorkspaceSelector((store) => store.activeView);
  const setActiveView = useWorkspaceSelector((store) => store.setActiveView);
  const setCommandPaletteOpen = useWorkspaceSelector((store) => store.setCommandPaletteOpen);
  const flushSync = useWorkspaceSelector((store) => store.flushSync);
  const pendingCount = useWorkspaceSelector((store) => store.sync.pendingCount);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [setCommandPaletteOpen]);
  const syncNow = useCallback(() => {
    void flushSync();
  }, [flushSync]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useKeyboardShortcuts({
    onCommandPalette: openCommandPalette,
    onSync: syncNow,
  });

  if (!hydrated) {
    return (
      <main className="app-loading" aria-live="polite">
        <LayoutGrid size={24} aria-hidden="true" />
        Loading workspace
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <Columns3 size={22} aria-hidden="true" />
          <div>
            <h1>Enterprise Data Workbench</h1>
            <p>Local-first operations with visible sync and reconciliation</p>
          </div>
        </div>

        <nav className="view-tabs" aria-label="Workspace views">
          {(['table', 'kanban', 'calendar'] as const).map((view) => (
            <button
              key={view}
              type="button"
              className={activeView === view ? 'is-active' : ''}
              onClick={() => setActiveView(view)}
              aria-pressed={activeView === view}
            >
              {view === 'table' ? <Table2 size={16} aria-hidden="true" /> : null}
              {view === 'kanban' ? <Columns3 size={16} aria-hidden="true" /> : null}
              {view === 'calendar' ? <CalendarDays size={16} aria-hidden="true" /> : null}
              {viewLabels[view]}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <span className="pending-badge" aria-label={`${pendingCount} pending operations`}>
            {pendingCount} pending
          </span>
          <button
            type="button"
            className="command-button"
            onClick={openCommandPalette}
            aria-label="Open command palette"
          >
            <Command size={16} aria-hidden="true" />
            <span>Command</span>
          </button>
        </div>
      </header>

      <PresenceLayer />

      <main className="workspace-layout">
        <div className="workspace-main">
          {activeView === 'table' ? <DataGrid /> : null}
          {activeView === 'kanban' ? <KanbanView /> : null}
          {activeView === 'calendar' ? <CalendarView /> : null}
        </div>
        <SyncInspector />
      </main>

      <CommandPalette />
    </div>
  );
}
