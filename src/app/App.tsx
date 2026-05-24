import { Command, Columns3, LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import {
  ArchitectureDiagram,
  CapabilityGrid,
  HeroSection,
  KeyboardHelp,
  QualityGateGrid,
  ResourceLinkGrid,
  SectionHeader,
  ThemeToggle,
  ViewTabs,
} from './ui';

type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'enterprise-data-workbench-theme';

/** Root application shell for the enterprise data workbench. */
export function App() {
  return (
    <WorkspaceStoreProvider>
      <WorkspaceApplication />
    </WorkspaceStoreProvider>
  );
}

/** Provider-bound application content used by the browser app and shell-level tests. */
export function WorkspaceApplication() {
  const hydrate = useWorkspaceSelector((store) => store.hydrate);
  const hydrated = useWorkspaceSelector((store) => store.hydrated);
  const activeView = useWorkspaceSelector((store) => store.activeView);
  const setActiveView = useWorkspaceSelector((store) => store.setActiveView);
  const commandPaletteOpen = useWorkspaceSelector((store) => store.commandPaletteOpen);
  const setCommandPaletteOpen = useWorkspaceSelector((store) => store.setCommandPaletteOpen);
  const flushSync = useWorkspaceSelector((store) => store.flushSync);
  const pendingCount = useWorkspaceSelector((store) => store.sync.pendingCount);
  const conflictCount = useWorkspaceSelector(
    (store) => store.conflicts.filter((conflict) => conflict.status === 'open').length,
  );
  const operationCount = useWorkspaceSelector((store) => store.operationLog.length);
  const recordCount = useWorkspaceSelector((store) => store.records.length);
  const [theme, setTheme] = usePersistedTheme();
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
    <div className="app-shell" data-theme={theme}>
      <header className="app-header">
        <div className="brand-block">
          <Columns3 size={22} aria-hidden="true" />
          <div>
            <h1>Enterprise Data Workbench</h1>
            <p>Local-first operations with visible sync and reconciliation</p>
          </div>
        </div>

        <div className="header-actions">
          <span className="pending-badge" aria-label={`${pendingCount} pending operations`}>
            {pendingCount} pending
          </span>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          />
          <button
            type="button"
            className="command-button"
            onClick={openCommandPalette}
            aria-label="Open command palette"
            aria-expanded={commandPaletteOpen}
            aria-controls="workspace-command-palette"
          >
            <Command size={16} aria-hidden="true" />
            <span>Command</span>
          </button>
        </div>
      </header>

      <main className="page-main">
        <HeroSection
          recordCount={recordCount}
          operationCount={operationCount}
          pendingCount={pendingCount}
          conflictCount={conflictCount}
        />
        <CapabilityGrid />
        <WorkbenchDemo activeView={activeView} setActiveView={setActiveView} />
        <div className="showcase-lower-grid">
          <ArchitectureDiagram />
          <KeyboardHelp />
        </div>
        <QualityGateGrid />
        <ResourceLinkGrid />
      </main>

      <CommandPalette />
    </div>
  );
}

interface WorkbenchDemoProps {
  readonly activeView: WorkspaceViewMode;
  readonly setActiveView: (view: WorkspaceViewMode) => void;
}

function WorkbenchDemo({ activeView, setActiveView }: WorkbenchDemoProps) {
  return (
    <section className="workbench-section" aria-labelledby="workbench-title">
      <SectionHeader
        id="workbench-title"
        eyebrow="Interactive demo"
        icon={LayoutGrid}
        title="Data-heavy workbench"
        description="Switch views, edit records, inspect pending operations and simulate reconciliation conflicts."
        actions={<ViewTabs activeView={activeView} onChange={setActiveView} />}
      />

      <PresenceLayer />

      <div className="workspace-layout">
        <div
          id={`workspace-panel-${activeView}`}
          className="workspace-main"
          role="tabpanel"
          aria-labelledby={`workspace-tab-${activeView}`}
          tabIndex={0}
        >
          {activeView === 'table' ? <DataGrid /> : null}
          {activeView === 'kanban' ? <KanbanView /> : null}
          {activeView === 'calendar' ? <CalendarView /> : null}
        </div>
        <SyncInspector />
      </div>
    </section>
  );
}

function usePersistedTheme(): readonly [ThemeMode, (theme: ThemeMode) => void] {
  const [theme, setThemeState] = useState<ThemeMode>(resolveInitialTheme);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
  }, []);

  return [theme, setTheme];
}

function resolveInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
