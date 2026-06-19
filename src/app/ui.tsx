import {
  Activity,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Columns3,
  ExternalLink,
  FileText,
  GitBranch,
  Keyboard,
  Layers3,
  Moon,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  Table2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { WorkspaceViewMode } from '../modules/workspace';

const githubRepositoryUrl = 'https://github.com/danielemasone/enterprise-data-workbench';
const githubUserGuideUrl = `${githubRepositoryUrl}/blob/main/guides/user-guide.md`;
const pagesBasePath = import.meta.env.BASE_URL;

const viewTabs = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const satisfies readonly {
  readonly id: WorkspaceViewMode;
  readonly label: string;
  readonly icon: LucideIcon;
}[];

const featurePanels = [
  {
    title: 'Dense grid workflows',
    description:
      'Inline edits, keyboard traversal, row selection, sorting, resizing and reordering.',
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
    description:
      'Command palette, arrow navigation, edit commit/cancel and sync shortcuts are visible.',
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
    description: 'Portfolio overview',
    href: `${githubRepositoryUrl}#readme`,
    icon: BookOpen,
  },
  {
    label: 'User guide',
    description: 'Practical app walkthrough',
    href: githubUserGuideUrl,
    icon: BookMarked,
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

const qualityGates = [
  ['TypeScript', 'Strict domain model and exported public types'],
  ['ESLint', 'Zero-warning lint pipeline for production code'],
  ['Vitest', 'Meaningful coverage for state, sync and UI flows'],
  ['TypeDoc', 'Generated API reference shipped with Pages'],
] as const;

export interface ThemeToggleProps {
  readonly theme: 'light' | 'dark';
  readonly onToggle: () => void;
}

/** Accessible dark/light mode control shared by the app header. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'light' ? (
        <Moon size={16} aria-hidden="true" />
      ) : (
        <Sun size={16} aria-hidden="true" />
      )}
    </button>
  );
}

export interface SectionHeaderProps {
  readonly id: string;
  readonly eyebrow?: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
}

/** Standard section heading used by portfolio and workbench panels. */
export function SectionHeader({
  id,
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div className="section-title-group">
        <span className="section-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <div>
          {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
          <h2 id={id}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </header>
  );
}

export interface ViewTabsProps {
  readonly activeView: WorkspaceViewMode;
  readonly onChange: (view: WorkspaceViewMode) => void;
}

/** Accessible workspace view switcher with arrow-key roving focus. */
export function ViewTabs({ activeView, onChange }: ViewTabsProps) {
  const refs = useRef<Partial<Record<WorkspaceViewMode, HTMLButtonElement>>>({});
  const activeIndex = viewTabs.findIndex((tab) => tab.id === activeView);

  const focusTab = useCallback((view: WorkspaceViewMode) => {
    window.setTimeout(() => refs.current[view]?.focus(), 0);
  }, []);

  const activateView = useCallback(
    (view: WorkspaceViewMode, focus = false) => {
      onChange(view);
      if (focus) {
        focusTab(view);
      }
    },
    [focusTab, onChange],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const keyOffsets: Partial<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1,
    };
    const offset = keyOffsets[event.key];

    if (offset) {
      event.preventDefault();
      const nextIndex = (activeIndex + offset + viewTabs.length) % viewTabs.length;
      activateView(viewTabs[nextIndex].id, true);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      activateView(viewTabs[0].id, true);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      activateView(viewTabs[viewTabs.length - 1].id, true);
    }
  };

  return (
    <div
      className="view-tabs"
      role="tablist"
      aria-label="Workbench views"
      onKeyDown={handleKeyDown}
    >
      {viewTabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          ref={(node) => {
            refs.current[id] = node ?? undefined;
          }}
          id={`workspace-tab-${id}`}
          type="button"
          role="tab"
          className={activeView === id ? 'is-active' : ''}
          onClick={() => activateView(id)}
          aria-selected={activeView === id}
          aria-controls={`workspace-panel-${id}`}
          tabIndex={activeView === id ? 0 : -1}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export interface HeroSectionProps {
  readonly recordCount: number;
  readonly operationCount: number;
  readonly pendingCount: number;
  readonly conflictCount: number;
}

export function HeroSection({
  recordCount,
  operationCount,
  pendingCount,
  conflictCount,
}: HeroSectionProps) {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          Senior frontend portfolio project
        </span>
        <h2 id="hero-title">A local-first enterprise data surface with visible state mechanics.</h2>
        <p>
          This app demonstrates how dense React workflows stay maintainable when editing, sync,
          persistence, presence and reconciliation are modeled as explicit domain behavior.
        </p>
      </div>
      <div className="hero-metrics" aria-label="Workspace metrics">
        <Metric label="Records" value={recordCount} />
        <Metric label="Operations" value={operationCount} />
        <Metric label="Pending" value={pendingCount} />
        <Metric label="Conflicts" value={conflictCount} />
      </div>
    </section>
  );
}

export function CapabilityGrid() {
  return (
    <section className="capability-section" aria-labelledby="capability-title">
      <SectionHeader
        id="capability-title"
        eyebrow="Why it matters"
        icon={Layers3}
        title="Enterprise interaction pressure, modeled explicitly"
        description="The visible UI is backed by reusable domain operations, local persistence and sync boundaries."
      />
      <div className="feature-panel-grid" aria-label="Implemented capability panels">
        {featurePanels.map(({ title, description, icon: Icon }) => (
          <article key={title} className="feature-panel">
            <Icon size={20} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ArchitectureDiagram() {
  return (
    <section className="architecture-panel" aria-labelledby="architecture-title">
      <SectionHeader
        id="architecture-title"
        icon={Network}
        title="Runtime architecture"
        description="Views derive from one document and mutations cross explicit boundaries."
      />
      <div className="architecture-flow" aria-label="Architecture flow">
        <DiagramNode icon={Layers3} label="UI views" detail="Grid, kanban, calendar, palette" />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode
          icon={GitBranch}
          label="Domain commands"
          detail="Operation factory and immutable mutations"
        />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode
          icon={Activity}
          label="Workspace state"
          detail="Records, conflicts, sync and presence"
        />
        <span className="flow-arrow" aria-hidden="true">
          -&gt;
        </span>
        <DiagramNode
          icon={RefreshCw}
          label="Boundaries"
          detail="IndexedDB, mock sync and reconciliation"
        />
      </div>
    </section>
  );
}

export function KeyboardHelp() {
  return (
    <section className="keyboard-panel" aria-labelledby="keyboard-title">
      <SectionHeader
        id="keyboard-title"
        icon={Keyboard}
        title="Keyboard shortcuts"
        description="Designed for repeat work, editing and sync inspection."
      />
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

export function QualityGateGrid() {
  return (
    <section className="quality-section" aria-labelledby="quality-title">
      <SectionHeader
        id="quality-title"
        icon={CheckCircle2}
        title="Quality gates"
        description="CI validates implementation quality and publishes the reports linked from the app."
      />
      <div className="quality-grid">
        {qualityGates.map(([title, description]) => (
          <article key={title} className="quality-card">
            <strong>{title}</strong>
            <span>{description}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResourceLinkGrid() {
  return (
    <nav className="resource-link-grid" aria-label="Project resources">
      {resourceLinks.map(({ label, description, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${label}: ${description}`}
        >
          <Icon size={18} aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ))}
    </nav>
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

interface DiagramNodeProps {
  readonly icon: LucideIcon;
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
