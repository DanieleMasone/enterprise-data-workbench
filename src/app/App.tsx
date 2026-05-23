import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Columns3,
  Command,
  ExternalLink,
  FileText,
  GitBranch,
  Keyboard,
  Layers3,
  LayoutGrid,
  Moon,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  Table2,
  Users,
} from 'lucide-react';
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

const viewLabels: Readonly<Record<WorkspaceViewMode, string>> = {
  table: 'Table',
  kanban: 'Kanban',
  calendar: 'Calendar',
};

type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'enterprise-data-workbench-theme';
const githubRepositoryUrl = 'https://github.com/danielemasone/enterprise-data-workbench';
const pagesBasePath = import.meta.env.BASE_URL;

const featurePanels = [
  {
    title: 'Dense grid workflows',
    description: 'Inline edits, keyboard traversal, row selection, sorting, resizing and reordering.',
    icon: Table2,
  },
  {
    title: 'Local-first sync',
    description: 'Every mutation becomes an operation before IndexedDB persistence and mock sync.',
    icon: RefreshCw,
  },
  {
    title: 'Reconciliation model',
    description: 'Conflicts are explicit records with local and remote values users can resolve.',
    icon: ShieldAlert,
  },
  {
    title: 'Collaboration facade',
    description: 'Presence cursors and remote conflict simulation show multi-user state pressure.',
    icon: Users,
  },
  {
    title: 'Keyboard UX',
    description: 'Command palette, arrow navigation, edit commit/cancel and sync shortcuts are visible.',
    icon: Keyboard,
  },
] as const;

const resourceLinks = [
  {
    label: 'GitHub',
    description: 'Source repository',
    href: githubRepositoryUrl,
    icon: GitBranch,
  },
  {
    label: 'README',
    description: 'Architecture and setup',
    href: `${githubRepositoryUrl}#readme`,
    icon: BookOpen,
  },
  {
    label: 'TypeDoc',
    description: 'Generated API docs',
    href: `${pagesBasePath}docs/`,
    icon: FileText,
  },
  {
    label: 'Coverage',
    description: 'Generated test report',
    href: `${pagesBasePath}coverage/`,
    icon: Activity,
  },
] as const;

const shortcuts = [
  ['Arrow keys', 'Move selected grid cell'],
  ['Enter', 'Edit or commit selected cell'],
  ['Escape', 'Cancel editing or close palette'],
  ['Tab', 'Move horizontally in the grid'],
  ['Ctrl/Cmd K', 'Open command palette'],
  ['Ctrl/Cmd S', 'Flush pending sync operations'],
] as const;

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
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-pressed={theme === 'dark'}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          </button>
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

      <ShowcaseOverview
        recordCount={recordCount}
        operationCount={operationCount}
        pendingCount={pendingCount}
        conflictCount={conflictCount}
      />

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

interface ShowcaseOverviewProps {
  readonly recordCount: number;
  readonly operationCount: number;
  readonly pendingCount: number;
  readonly conflictCount: number;
}

function ShowcaseOverview({
  recordCount,
  operationCount,
  pendingCount,
  conflictCount,
}: ShowcaseOverviewProps) {
  return (
    <section className="showcase-overview" aria-labelledby="showcase-title">
      <div className="showcase-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Senior frontend portfolio project
          </span>
          <h2 id="showcase-title">A local-first enterprise data surface with visible state mechanics.</h2>
          <p>
            This app demonstrates how dense React workflows can stay maintainable when editing, sync,
            persistence, presence and reconciliation are modeled as explicit domain behavior.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Workspace metrics">
          <Metric label="Records" value={recordCount} />
          <Metric label="Operations" value={operationCount} />
          <Metric label="Pending" value={pendingCount} />
          <Metric label="Conflicts" value={conflictCount} />
        </div>
      </div>

      <div className="feature-panel-grid" aria-label="Implemented capability panels">
        {featurePanels.map(({ title, description, icon: Icon }) => (
          <article key={title} className="feature-panel">
            <Icon size={20} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <nav className="resource-link-grid" aria-label="Project resources">
        {resourceLinks.map(({ label, description, href, icon: Icon }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${label}: ${description}`}>
            <Icon size={18} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ))}
      </nav>

      <div className="showcase-lower-grid">
        <ArchitectureDiagram />
        <KeyboardHelp />
      </div>
    </section>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: number;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <section className="architecture-panel" aria-labelledby="architecture-title">
      <div className="section-heading">
        <Network size={20} aria-hidden="true" />
        <div>
          <h3 id="architecture-title">Runtime architecture</h3>
          <p>Views derive from one document and mutations cross explicit boundaries.</p>
        </div>
      </div>
      <div className="architecture-flow" aria-label="Architecture flow">
        <DiagramNode icon={Layers3} label="UI views" detail="Grid, kanban, calendar, palette" />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode icon={GitBranch} label="Domain commands" detail="Operation factory and immutable mutations" />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode icon={Activity} label="Workspace state" detail="Records, conflicts, sync and presence" />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode icon={RefreshCw} label="Boundaries" detail="IndexedDB, mock sync and reconciliation" />
      </div>
    </section>
  );
}

interface DiagramNodeProps {
  readonly icon: typeof Layers3;
  readonly label: string;
  readonly detail: string;
}

function DiagramNode({ icon: Icon, label, detail }: DiagramNodeProps) {
  return (
    <div className="diagram-node">
      <Icon size={18} aria-hidden="true" />
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

function KeyboardHelp() {
  return (
    <section className="keyboard-panel" aria-labelledby="keyboard-title">
      <div className="section-heading">
        <Keyboard size={20} aria-hidden="true" />
        <div>
          <h3 id="keyboard-title">Keyboard shortcuts</h3>
          <p>Designed for repeat work, editing and sync inspection.</p>
        </div>
      </div>
      <dl className="shortcut-list">
        {shortcuts.map(([key, description]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>
              <CheckCircle2 size={14} aria-hidden="true" />
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
