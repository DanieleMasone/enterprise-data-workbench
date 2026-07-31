# AGENTS.md

Operational guidance for future AI coding agents maintaining Enterprise Data Workbench.

## Architecture

- Treat `src/modules/workspace/model` as the source of truth for domain terminology and state shape.
- Keep table, kanban and calendar views derived from the shared `WorkspaceState`; do not add per-view copies of records.
- Route user intent through workspace commands in `state/workspace.store.ts`.
- Use domain helpers in `domain/` for immutable selectors, operation creation and state mutation.
- Keep persistence, synchronization and reconciliation behind `services/` boundaries.
- Keep portfolio/showcase UI state, such as theme preference, outside the workspace document unless it affects domain behavior.

## Domain Terminology

- `WorkbenchRecord`: shared row/work item used by every view.
- `WorkspaceField`: column metadata and field type definition.
- `WorkspaceOperation`: serializable mutation envelope for optimistic updates, replay and inspection.
- `WorkspaceConflict`: explicit field-level conflict produced by sync or simulation.
- `SyncStatus`: visible sync mode, pending count, last sync time and error state.

## Coding Conventions

- Use strict TypeScript and avoid `any`. If an escape hatch is unavoidable, document why near the code.
- Prefer small cohesive modules over large component files.
- Keep React components focused on rendering and event binding; domain decisions belong in commands or domain helpers.
- Keep comments useful and non-obvious. Public modules, services, hooks and domain logic should have JSDoc.
- Do not add console noise to production code.
- Keep generated `dist/`, `coverage/` and `docs/` out of git.

## State Management Rules

- Do not mutate records, fields, operation logs or conflicts in place.
- Do not duplicate derived state between views.
- New workspace mutations must create explicit `WorkspaceOperation` entries unless they are purely transient UI state.
- Pending operation counts must be derived from operation status, not manually guessed.
- Persistence should save serializable workspace snapshots only.

## Synchronization Model

- Optimistic updates apply locally before sync.
- `WorkspaceSyncService` submits pending operations and returns acknowledgements, conflicts and remote operations.
- `reconcileSyncResult` is responsible for operation status updates and conflict merging.
- Conflict resolution must keep local-vs-remote choice explicit and visible in the operation log.

## Testing Expectations

- Add tests beside the module or in the relevant workspace test area.
- Use Testing Library for user-visible UI behavior.
- Use injected persistence and sync mocks for store tests.
- Cover domain behavior, optimistic updates, reconciliation, keyboard workflows and practical table/kanban interactions.
- Cover portfolio-shell behavior when adding visible showcase sections, theme controls or architecture/help panels.
- Use Playwright for integrated browser behavior: production preview smoke, desktop/mobile layout, keyboard command palette, persisted theme, real tab switching, sync/conflict flows and stable public links.
- Keep Playwright lean. Do not duplicate domain permutations already covered by Vitest.
- Avoid E2E flakes: prefer role/label locators, deterministic seeded data, no external navigation, no fixed sleeps and no assertions that depend on animation timing.
- Keep coverage thresholds meaningful; do not add snapshot-only tests to inflate coverage.

## CI/CD Expectations

- `npm run ci` should remain the local validation equivalent of CI.
- GitHub Actions must run install, Playwright browser install, formatting, typecheck, lint, coverage, build, docs and Playwright E2E.
- Pages deployments must publish the Vite `dist/` artifact from CI and include `dist/guide/`, generated `dist/docs/` and generated `dist/coverage/`.
- Keep the workflow simple: one validation/build job, one Pages deploy job, and deployment only from non-PR `main` runs.
- Upload Playwright reports as short-retention CI artifacts on failure; keep `playwright-report/`, `test-results/` and traces out of git.
- Check official GitHub action release notes before changing action majors. Avoid obsolete actions, deprecated actions and warning-heavy dependency choices.

## Documentation Expectations

- Treat README.md as the concise portfolio landing page, not the full product manual.
- Treat the React `/guide/` experience in `src/app/guide/` as the primary end-user documentation.
- Keep maintainer architecture and testing documentation under `guides/`; do not recreate the user manual there.
- Reserve ignored `docs/` for generated TypeDoc output; never mix source guides into that directory.
- Keep README, User Guide, maintainer guides, TypeDoc and coverage links consistent without duplicating explanations.
- Keep the README Mermaid diagram and the in-app architecture diagram aligned with the actual code paths.
- Keep live demo, TypeDoc and coverage links stable when deployment paths change.
- Keep TypeDoc warning-free.
- Export public option and parameter types referenced by public functions/classes.
- Update AGENTS.md when architecture rules or terminology changes.

## Portfolio UI Rules

- The deployed app should communicate capability quickly: project pitch, feature panels, architecture, keyboard help and the live workspace must remain visible and responsive.
- Prefer functional controls over decorative copy. Dark mode, command palette, conflict simulation and sync actions should be real.
- Dark mode must respect system preference on first load, persist explicit user preference and preserve contrast in both themes.
- Keep showcase sections full-width or grid-based; avoid nested cards and avoid duplicating workspace state for presentation.
- Maintain accessible labels, focus states and keyboard paths for all new controls.
- Do not add visible buttons, links or controls unless they perform the advertised action or are explicitly disabled with a useful reason.

## Anti-Patterns To Avoid

- Per-view record caches that can drift from the shared model.
- UI handlers that directly rewrite records without domain commands.
- Hidden sync state stored only in component state.
- Overbroad global state for transient component-only concerns.
- Unbounded operation log spam from high-frequency pointer events.
- Accessibility regressions in grid focus, editing and command palette flows.
- README claims that are not implemented in the app or tests.

## Safe Extension Pattern

1. Add or update model types first.
2. Add operation factory and immutable mutation helpers.
3. Expose a store command with injected service boundaries where needed.
4. Render the feature from derived workspace state.
5. Add tests for domain logic, state mutation and the user-facing workflow.
6. Remove temporary code, dead exports, stale TODOs, generated artifacts and misleading documentation claims.
7. Run `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build`, `npm run docs` and `npm run test:e2e`.
