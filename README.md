# Enterprise Data Workbench

Enterprise Data Workbench is a React, TypeScript and Vite application for dense, local-first data workflows. It demonstrates a domain-first architecture for editable records, multiple synchronized views, optimistic updates, mock collaboration, explicit sync state and conflict reconciliation.

## Features

- Data grid with inline cell editing, keyboard navigation, row selection, sorting, column resizing and column reordering.
- Shared table, kanban and calendar views backed by one record model.
- Command palette with keyboard-first view switching, sync and conflict simulation.
- Local IndexedDB persistence through Dexie.
- Explicit operation log with pending, acknowledged, conflicted and reverted states.
- Mock synchronization service with optimistic updates and deterministic conflict simulation.
- Reconciliation service for server acknowledgements, remote values and user-selected conflict resolution.
- Presence layer with fake collaborators and cursor locations.
- Sync inspector for pending operations, conflicts and manual reconciliation.
- Strict TypeScript, ESLint, Prettier, Vitest, Testing Library and TypeDoc.
- GitHub Actions CI with coverage generation, TypeDoc generation, Vite production build and GitHub Pages deployment.

## Feature Walkthrough

The first screen is the workbench itself. The table view is the primary editing surface: select cells, press `Enter` to edit, commit with `Enter` or cancel with `Escape`, move with arrow keys, and use `Tab` or `Shift+Tab` to move horizontally. Column headers expose sorting, resize handles and reorder controls.

The kanban view groups the same records by `status`. Moving a card writes a `record.status.move` operation into the shared operation log, so the table and calendar immediately reflect the change.

The calendar view groups the same records by `dueDate`. It intentionally stays simple: records are bucketed by date from the domain model rather than copied into a calendar-specific store.

The sync inspector shows the operation queue, current sync mode, open conflicts and reconciliation actions. Conflict indicators also appear directly on affected grid cells.

## Keyboard UX

- Arrow keys: move selected cell.
- `Enter`: start editing the selected cell.
- `Enter` while editing: commit the draft value.
- `Escape` while editing: cancel and restore the original value.
- `Tab` / `Shift+Tab`: move horizontally through cells.
- `Ctrl+K` / `Cmd+K`: open the command palette.
- `Ctrl+S` / `Cmd+S`: flush pending sync operations.

Focus is managed so the selected grid cell remains keyboard-addressable after navigation and editing transitions.

## Architecture

```text
src/
  app/
    App.tsx
  modules/
    workspace/
      components/
        DataGrid/
        KanbanView/
        CalendarView/
        CommandPalette/
        PresenceLayer/
        SyncInspector/
      data/
      domain/
      hooks/
      model/
      services/
      state/
      test/
  styles.css
```

### Domain Model

Records are stored as `WorkbenchRecord` objects with typed field metadata and serializable cell values. Views derive their presentation from the same document:

- `fields`
- `fieldOrder`
- `records`
- `operationLog`
- `conflicts`
- `sync`
- explicit interaction state for selection, editing, sorting and active view

There is no duplicated per-view data store. UI handlers call workspace commands; commands create domain operations; operations mutate the document optimistically; persistence and sync run at explicit service boundaries.

### Synchronization And Reconciliation

Local edits are applied immediately and appended to the operation log as `pending`. The mock sync service acknowledges successful operations and can produce deterministic conflicts. Reconciliation updates operation status, merges remote operations and stores open conflicts separately from the optimistic record value. Users can resolve conflicts by keeping the local value or accepting the remote value.

### Persistence

`DexieWorkspacePersistence` stores the serializable workspace snapshot in IndexedDB. Tests use in-memory persistence mocks to verify the boundary without coupling store tests to IndexedDB.

## Setup

Use Node 22 or newer.

```bash
npm ci
npm run dev
```

The development server runs with Vite. For local production verification:

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` - start the Vite dev server.
- `npm run build` - create the production Vite build in `dist/`.
- `npm run preview` - preview the production build locally.
- `npm run test` - run Vitest in watch mode.
- `npm run test:coverage` - run tests and generate coverage reports.
- `npm run typecheck` - run strict TypeScript checking.
- `npm run lint` - run ESLint with zero warnings allowed.
- `npm run docs` - generate TypeDoc output in `docs/`.
- `npm run ci` - run typecheck, lint, coverage, build and docs locally.

Generated `dist/`, `coverage/` and `docs/` output is ignored and should not be committed.

## Testing And Coverage

Vitest runs with Testing Library and jsdom. The suite covers:

- domain selectors and mutations
- operation creation and optimistic state updates
- inline editing commit and cancel flows
- keyboard navigation
- table row selection, sorting and column reordering
- kanban status movement logic
- command palette filtering and execution
- sync acknowledgements and conflict reconciliation
- persistence boundaries using mocks and a fake IndexedDB-backed Dexie test

Coverage is generated in CI and locally through `npm run test:coverage`. Current thresholds are:

- statements: 75%
- branches: 65%
- functions: 75%
- lines: 75%

## Documentation

TypeDoc generates API documentation from exported domain, service, hook and state modules:

```bash
npm run docs
```

The generated `docs/` directory is intentionally excluded from git. CI verifies documentation generation but only deploys the Vite production build to GitHub Pages.

## CI/CD

The GitHub Actions workflow runs on pull requests, pushes to `main` and manual dispatches. It performs:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test:coverage`
5. `npm run build`
6. `npm run docs`
7. GitHub Pages artifact upload and deployment for non-PR runs

The workflow uses the modern GitHub Pages Actions flow: `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`. The deployable artifact comes from Vite's `dist/` build.

Reference guidance:

- [GitHub Pages with custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Actions Pages deployment](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms)
- [Vite static deployment guide](https://vite.dev/guide/static-deploy.html#github-pages)

## GitHub Pages Deployment

Vite is configured with the repository base path:

```ts
base: process.env.VITE_BASE_PATH ?? '/enterprise-data-workbench/'
```

CI sets `VITE_BASE_PATH=/enterprise-data-workbench/` before building for Pages. No generated build artifacts need to be committed.

To enable deployment in GitHub:

1. Open repository settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Push to `main` or run the workflow manually.

## Performance Considerations

- Views derive data with memoized selectors and avoid duplicating records.
- Mutations are immutable and scoped to affected fields or records.
- The operation log makes expensive synchronization work explicit.
- The current grid is suitable for moderate enterprise datasets. Very large datasets should add row and column virtualization.

## Technical Trade-Offs

- Collaboration is mocked. It demonstrates presence, operation queues and conflicts without WebSockets or CRDTs.
- Conflict resolution is field-level and deterministic. A production backend would need authorization, server versions and richer merge policies.
- Calendar rendering is a compact grouped-date projection rather than a full scheduling engine.
- Column resizing commits on pointer release to keep the operation log useful instead of recording every pointer move.

## Future Improvements

- Real-time collaboration via WebSockets.
- CRDT-backed merge semantics.
- Virtualized rendering for very large tables.
- Multi-workspace routing and permissions.
- Undo/redo powered by the existing operation envelopes.
- Visual regression tests for dense grid states.

## Project Status

The README specification has been implemented as a stable frontend demonstration project with CI, tests, documentation generation and GitHub Pages deployment configuration.
