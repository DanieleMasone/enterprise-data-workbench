import type { ReactNode } from 'react';
import { ArchitectureDiagram } from '../ui';

export const guideNavigation = [
  ['introduction', 'Introduction'],
  ['application-overview', 'Application overview'],
  ['architecture-overview', 'Architecture overview'],
  ['workspace-overview', 'Workspace overview'],
  ['table-view', 'Table view'],
  ['kanban-view', 'Kanban view'],
  ['calendar-view', 'Calendar view'],
  ['keyboard-shortcuts', 'Keyboard shortcuts'],
  ['operations-and-sync', 'Operations and sync'],
  ['conflicts', 'Conflict handling'],
  ['theme-and-accessibility', 'Theme and accessibility'],
  ['responsive-behaviour', 'Responsive and mobile'],
] as const;

/** End-user workflows rendered inside the published React documentation experience. */
export function GuideContent() {
  return (
    <article className="guide-article">
      <GuideSection
        id="introduction"
        eyebrow="Start here"
        title="Introduction"
        summary="Enterprise Data Workbench is an inspectable local-first workspace for data-heavy frontend workflows."
      >
        <p>
          The demo keeps editing, persistence, optimistic operations, synchronization and conflict
          resolution visible. It is intentionally small enough to explore, while preserving the
          boundaries used by larger enterprise interfaces.
        </p>
        <div className="guide-callout">
          <strong>Local-first by design</strong>
          <span>
            Changes appear immediately, are persisted in IndexedDB and remain pending until the mock
            synchronization service acknowledges or conflicts them.
          </span>
        </div>
      </GuideSection>

      <GuideSection
        id="application-overview"
        eyebrow="Product map"
        title="Application overview"
        summary="The published page combines a technical portfolio shell with a fully interactive workbench."
      >
        <ul>
          <li>The header exposes pending state, the persisted theme and the command palette.</li>
          <li>Table, Kanban and Calendar are views over the same record collection.</li>
          <li>Presence shows deterministic collaborator and cursor data.</li>
          <li>The sync inspector exposes pending work, recent operations and open conflicts.</li>
          <li>
            Quality and documentation links point to artifacts generated from the same CI run.
          </li>
        </ul>
      </GuideSection>

      <ArchitectureDiagram
        id="architecture-overview"
        title="Architecture overview"
        description="User intent crosses explicit command, state and service boundaries before returning to the views."
      />

      <GuideSection
        id="workspace-overview"
        eyebrow="One document"
        title="Workspace overview"
        summary="Records, fields and field order belong to one shared workspace document."
      >
        <p>
          The active view changes presentation, not ownership. A status move in Kanban is visible in
          Table; a due-date edit in Table changes the Calendar projection. Selection, editing, sort
          and active view remain explicit interaction state alongside the document.
        </p>
        <dl className="guide-definition-grid">
          <div>
            <dt>Records</dt>
            <dd>Serializable work items consumed by every view.</dd>
          </div>
          <div>
            <dt>Fields</dt>
            <dd>Column metadata, data type, width and categorical options.</dd>
          </div>
          <div>
            <dt>Operations</dt>
            <dd>Typed mutation envelopes used for optimistic updates and inspection.</dd>
          </div>
          <div>
            <dt>Conflicts</dt>
            <dd>Field-level local and remote values awaiting an explicit choice.</dd>
          </div>
        </dl>
      </GuideSection>

      <GuideSection
        id="table-view"
        eyebrow="Primary editor"
        title="Table view"
        summary="Use the dense grid for precise selection, editing, sorting and layout control."
      >
        <h3>Inline editing</h3>
        <ol>
          <li>Double-click a cell, or select it and press Enter.</li>
          <li>Change the value in the inline editor.</li>
          <li>Press Enter to commit or Escape to cancel.</li>
        </ol>
        <p>
          A changed value creates a pending <code>cell.update</code> operation. Committing the
          original value is a no-op.
        </p>

        <h3>Selection model</h3>
        <p>
          Cell selection drives keyboard movement, editing and conflict simulation. Row checkboxes
          maintain a separate multi-row selection and never edit data.
        </p>

        <h3>Sorting and columns</h3>
        <ul>
          <li>Activate a column label to cycle ascending, descending and unsorted states.</li>
          <li>
            Drag a resize handle; one resize operation is committed when the pointer is released.
          </li>
          <li>Use the left and right header actions to reorder a column.</li>
        </ul>
      </GuideSection>

      <GuideSection
        id="kanban-view"
        eyebrow="Status projection"
        title="Kanban view"
        summary="Kanban groups the shared records by status and writes moves through the same command layer."
      >
        <ul>
          <li>Drag a card into another status column.</li>
          <li>Use the labeled card action when dragging is inconvenient or unavailable.</li>
          <li>Read title, owner and due date directly from each card.</li>
          <li>Return to Table to inspect the updated status and pending operation.</li>
        </ul>
        <p>
          Every successful move creates a <code>record.status.move</code> operation. Empty status
          columns retain a clear empty state.
        </p>
      </GuideSection>

      <GuideSection
        id="calendar-view"
        eyebrow="Date projection"
        title="Calendar view"
        summary="Calendar is a read-only grouping of shared records by due date."
      >
        <p>
          Each date section shows its record count, while each item shows title, owner and status.
          Records without a usable date appear in an Unscheduled group. Edit dates in Table and
          return to Calendar to see the projection update.
        </p>
      </GuideSection>

      <GuideSection
        id="keyboard-shortcuts"
        eyebrow="Repeat work"
        title="Keyboard shortcuts"
        summary="Core navigation, editing and synchronization workflows do not require a pointer."
      >
        <div className="guide-table-wrap">
          <table className="guide-shortcut-table">
            <thead>
              <tr>
                <th scope="col">Shortcut</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <Shortcut keys="Arrow keys" action="Move the selected grid cell" />
              <Shortcut keys="Enter" action="Start editing or commit the draft" />
              <Shortcut keys="Escape" action="Cancel editing or close the command palette" />
              <Shortcut keys="Tab / Shift+Tab" action="Move horizontally through grid cells" />
              <Shortcut keys="Ctrl/Cmd K" action="Open the command palette" />
              <Shortcut keys="Ctrl/Cmd S" action="Flush pending operations" />
            </tbody>
          </table>
        </div>

        <h3>Command Palette</h3>
        <p>
          Open the palette from the header or with Ctrl/Cmd K. Type to filter, use Up and Down to
          change the active option, Enter to run it and Escape to close. Commands switch views, sync
          pending work and simulate a conflict on the selected cell.
        </p>
      </GuideSection>

      <GuideSection
        id="operations-and-sync"
        eyebrow="Local-first mechanics"
        title="Operation Log and Sync Inspector"
        summary="The inspector makes optimistic updates and synchronization state observable."
      >
        <h3>Optimistic updates</h3>
        <p>
          Cell edits, status moves and column layout changes update the UI before remote
          acknowledgement. Each mutation is appended to the operation log with a lifecycle status.
        </p>
        <dl className="guide-status-list">
          <div>
            <dt>pending</dt>
            <dd>Applied locally and waiting for synchronization.</dd>
          </div>
          <div>
            <dt>acknowledged</dt>
            <dd>Accepted by the mock synchronization service.</dd>
          </div>
          <div>
            <dt>conflicted</dt>
            <dd>Requires an explicit local or remote resolution.</dd>
          </div>
          <div>
            <dt>reverted</dt>
            <dd>Superseded when the remote value is accepted.</dd>
          </div>
        </dl>
        <p>
          Sync is enabled only when pending operations exist. The header badge, inspector metrics
          and polite live region report the current state.
        </p>
      </GuideSection>

      <GuideSection
        id="conflicts"
        eyebrow="Reconciliation"
        title="Conflict simulation and resolution"
        summary="Use the selected cell to exercise the same explicit conflict model used by synchronization."
      >
        <ol>
          <li>Select a target cell in Table.</li>
          <li>Choose Conflict in the inspector or command palette.</li>
          <li>Compare the local value with the simulated remote collaborator value.</li>
          <li>Choose Local to keep the optimistic value or Remote to apply the remote value.</li>
        </ol>
        <p>
          Resolution closes the conflict and persists the resulting workspace. Accepting Remote also
          updates the operation lifecycle so the log explains what happened.
        </p>
      </GuideSection>

      <GuideSection
        id="theme-and-accessibility"
        eyebrow="Inclusive operation"
        title="Dark mode and accessibility"
        summary="The workbench and this guide share one persisted theme and the same interaction standards."
      >
        <ul>
          <li>The first visit respects the operating-system color preference.</li>
          <li>The header theme control persists an explicit choice in local storage.</li>
          <li>View tabs expose selection and support arrow, Home and End navigation.</li>
          <li>The grid preserves visible focus while selection and editing move.</li>
          <li>The command palette uses dialog and option semantics with managed focus.</li>
          <li>Sync and conflict changes are announced through a polite live region.</li>
          <li>Reduced-motion preferences suppress non-essential transitions.</li>
        </ul>
      </GuideSection>

      <GuideSection
        id="responsive-behaviour"
        eyebrow="Any viewport"
        title="Responsive behaviour and mobile usage"
        summary="The portfolio shell, workbench and documentation reorganize without introducing page-level overflow."
      >
        <ul>
          <li>Workbench and inspector panels stack at tablet widths.</li>
          <li>Table overflow remains inside the data region rather than widening the page.</li>
          <li>View tabs become equal-width touch targets on small screens.</li>
          <li>Documentation navigation moves above the article on mobile.</li>
          <li>Kanban card actions provide a touch-friendly alternative to drag-and-drop.</li>
        </ul>
      </GuideSection>
    </article>
  );
}

interface GuideSectionProps {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly children: ReactNode;
}

function GuideSection({ id, eyebrow, title, summary, children }: GuideSectionProps) {
  return (
    <section id={id} className="guide-section" aria-labelledby={`${id}-title`}>
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="guide-section-summary">{summary}</p>
      <div className="guide-section-body">{children}</div>
    </section>
  );
}

interface ShortcutProps {
  readonly keys: string;
  readonly action: string;
}

function Shortcut({ keys, action }: ShortcutProps) {
  return (
    <tr>
      <th scope="row">
        <kbd>{keys}</kbd>
      </th>
      <td>{action}</td>
    </tr>
  );
}
