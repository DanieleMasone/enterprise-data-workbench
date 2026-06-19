# Testing And CI Guide

The validation strategy separates fast domain feedback from browser-level confidence. Each layer owns a different risk and avoids duplicating the same assertions everywhere.

## Test Layers

| Layer                  | Tooling                       | Primary responsibility                                                                 |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| Domain and state       | Vitest                        | Selectors, immutable mutations, operation creation, reconciliation and commands        |
| Components             | Testing Library + jsdom       | Accessible user behavior, editing, tabs, palette, inspector and theme state            |
| Persistence boundaries | Vitest + fake IndexedDB/mocks | Loading, saving and injected service contracts                                         |
| End to end             | Playwright                    | Production build, real browser UX, Pages base path and integrated desktop/mobile flows |

## Vitest And Testing Library

Vitest is the coverage-producing test runner. Tests live beside their modules or in the relevant workspace test area.

Unit and component tests should cover:

- Operation factories and immutable document mutations.
- Shared selectors and table/kanban/calendar projections.
- Store commands, optimistic updates and pending-count derivation.
- Persistence and sync boundaries through injected mocks.
- Reconciliation and local/remote conflict resolution.
- Inline editing commit/cancel, selection, sorting and column controls.
- Keyboard shortcuts, accessible view tabs and command-palette behavior.
- Sync inspector, theme preference and portfolio resource links.

Testing Library queries should prefer accessible roles, names and labels. Snapshot-only tests are not a substitute for behavioral assertions.

## Coverage

`npm run test:coverage` uses the V8 provider and emits text, HTML, JSON summary and LCOV output into ignored `coverage/`.

Current global thresholds:

| Metric     | Threshold |
| ---------- | --------: |
| Statements |       75% |
| Branches   |       65% |
| Functions  |       75% |
| Lines      |       75% |

The latest deployed HTML report is available at [GitHub Pages coverage](https://danielemasone.github.io/enterprise-data-workbench/coverage/). Coverage measures the Vitest suite; Playwright is not included in line coverage.

Vitest test files run serially to avoid worker-startup flakiness on constrained local and CI environments.

## Playwright

Playwright covers behavior that jsdom cannot validate reliably:

- Production Vite preview boot with `/enterprise-data-workbench/` as the base path.
- Critical browser-console errors.
- Desktop and Pixel 5 mobile layouts.
- Table, kanban and calendar tab switching.
- Persisted dark mode after reload.
- Real inline edit, operation log, sync and conflict flows.
- Command-palette keyboard interaction and focus.
- Public resource link targets and mobile horizontal overflow.

Keep E2E tests focused on user-visible integration. Domain permutations, error branches and pure projection logic belong in Vitest.

### Flake Prevention

- Prefer `getByRole`, `getByLabel` and stable accessible names.
- Use seeded workspace data and injected deterministic services.
- Wait for visible state instead of fixed timeouts.
- Do not depend on external navigation; assert stable `href` values instead.
- Keep animation timing out of assertions.
- Capture traces on the first retry and screenshots/videos only for failures.
- Keep the browser matrix pragmatic: Chromium desktop and Chromium mobile emulation.

Playwright writes ignored `playwright-report/` and `test-results/` directories. CI uploads the HTML report only when the workflow fails and retains it for seven days.

## TypeDoc

`npm run docs` generates the exported workspace API from `src/modules/workspace/index.ts` into ignored `docs/`. TypeDoc treats warnings as errors.

`docs/` is generated output. Committed user and engineering documentation belongs in `guides/` so source guides cannot collide with the published TypeDoc route.

The latest generated reference is published at [GitHub Pages TypeDoc](https://danielemasone.github.io/enterprise-data-workbench/docs/).

## Local Validation

Install dependencies and the browser once:

```bash
npm ci
npx playwright install chromium
```

Run individual checks:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run docs
npm run test:e2e
npm run pages:reports
```

Run the local CI equivalent:

```bash
npm run ci
```

`npm run ci` validates and assembles reports locally; it does not deploy.

## GitHub Actions Workflow

`.github/workflows/ci.yml` contains one validation/build job and one dependent Pages deploy job.

### Pull Requests

Pull requests run:

1. `npm ci` with the setup-node npm cache.
2. Chromium installation through Playwright.
3. Type checking and zero-warning linting.
4. Vitest coverage.
5. The Vite production build.
6. TypeDoc generation.
7. Playwright against the already-built Vite preview.

Pull requests do not configure, upload or deploy GitHub Pages.

### Main And Manual Dispatch

Pushes and manual dispatches on `main` run the same quality gates, then:

1. `npm run pages:reports` copies `coverage/` to `dist/coverage/` and `docs/` to `dist/docs/`.
2. `actions/configure-pages` configures the Pages context.
3. `actions/upload-pages-artifact` uploads only `dist/`.
4. The dependent deploy job uses `actions/deploy-pages` with `pages: write` and `id-token: write`.

Concurrency cancels an older run for the same workflow/ref so stale Pages builds do not overlap.

## Published Artifact Layout

```text
dist/
  index.html            Vite application
  assets/               production JS/CSS
  docs/                 generated TypeDoc
  coverage/             generated coverage HTML
```

The app and both reports are one Pages artifact. No generated `dist/`, `docs/` or `coverage/` output is committed.

Stable published URLs:

- [Application](https://danielemasone.github.io/enterprise-data-workbench/)
- [TypeDoc](https://danielemasone.github.io/enterprise-data-workbench/docs/)
- [Coverage](https://danielemasone.github.io/enterprise-data-workbench/coverage/)

## Artifact Strategy

- The Pages artifact contains only the deployable `dist/` tree.
- TypeDoc and coverage are published inside that artifact, not uploaded separately.
- Playwright reports are diagnostic CI artifacts on failure only.
- Generated outputs remain ignored locally and are recreated from source on every CI run.
