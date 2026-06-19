# User Guide

This guide explains how to use the published [Enterprise Data Workbench](https://danielemasone.github.io/enterprise-data-workbench/). The application is a local-first portfolio demo: changes are applied immediately, stored in the browser and represented as explicit operations before mock synchronization.

## Getting Oriented

The page combines a portfolio overview with an interactive workbench. The workbench contains:

- Table, Kanban and Calendar view tabs.
- Fake collaborator presence and live cursor locations.
- The active data view.
- A sync inspector with pending operations, recent history and conflicts.

All three views read from the same records. Editing a record in one view changes what the other projections display.

## Table View

Table is the primary editing surface.

### Select Cells And Rows

- Click a cell to make it the active cell.
- Use the checkbox at the beginning of a row to add or remove that record from row selection.
- The selected-row count appears above the grid.

Cell selection drives keyboard navigation and determines which field the conflict simulator targets. Row selection is separate and does not edit data.

### Edit A Cell

1. Double-click a cell, or select it and press `Enter`.
2. Change the value in the inline editor.
3. Press `Enter` to commit or `Escape` to cancel.

A committed change updates the record immediately and adds a pending `cell.update` entry to the sync inspector. Committing an unchanged value does not create an operation.

### Sort Records

Use a column header's sort button. Repeated activation cycles through ascending, descending and unsorted states. The shared sort state also affects the order used by the kanban and calendar projections where applicable.

### Resize And Reorder Columns

- Drag a header's resize handle horizontally to change its width. The resize operation is committed when the pointer is released.
- Use the left and right header controls to move a column relative to its neighbor.

Layout changes are first-class operations and are persisted with the workspace.

### Keyboard Navigation

With a grid cell selected:

- Arrow keys move one cell in the requested direction.
- `Tab` and `Shift+Tab` move horizontally.
- `Enter` starts editing or commits the current draft.
- `Escape` cancels editing.

Focus follows the selected cell so the workflow does not require a pointer.

## Kanban View

Open Kanban from the workbench tabs or command palette. Records are grouped by the shared `status` field.

- Drag a card into another status column to move it.
- Alternatively, use the labeled action on a card to move it to the displayed status without dragging.
- The card shows its title, owner and due date.
- Empty status groups display an explicit empty state.

A move updates the shared record immediately and creates a `record.status.move` operation. Return to Table to see the same status value there.

## Calendar View

Calendar is a read-only projection grouped by the `dueDate` field.

- Each date section reports its number of records.
- Items show title, owner and current status.
- Records without usable dates are excluded from dated groups.
- An empty-state message appears when no records can be scheduled.

Edit dates or other values in Table, then return to Calendar to see the derived projection.

## View Tabs

Table, Kanban and Calendar are accessible tabs:

- Click or tap a tab to activate it.
- Use Left/Right or Up/Down while a tab is focused.
- Use `Home` for Table and `End` for Calendar.

The selected tab exposes `aria-selected="true"` and controls one visible tab panel.

## Command Palette

Open the palette with the header Command button or `Ctrl+K` / `Cmd+K`.

Available commands include:

- Open table view.
- Open kanban view.
- Open calendar view.
- Sync pending operations.
- Simulate a conflict on the selected cell.

Type to filter commands, use Up/Down to change the active option, press `Enter` to run it, or press `Escape` to close the dialog. Focus moves into the search field when the palette opens.

## Theme

Use the moon/sun button in the header to switch between light and dark themes. The first visit respects the operating-system preference. An explicit choice is stored in `localStorage` and restored on reload.

## Sync Inspector

The inspector makes local-first state visible.

### Pending Operations

Edits, kanban moves and column layout changes appear immediately as pending operations. The header badge and inspector metrics show the current count.

### Sync

The Sync button is enabled only when pending work exists. Activating it submits pending operations to the mock service. Successful operations become `acknowledged`; simulated disagreements become `conflicted`.

`Ctrl+S` / `Cmd+S` triggers the same sync action.

### Operation Log

The operation log shows the most recent operation types and lifecycle statuses:

- `pending`
- `acknowledged`
- `conflicted`
- `reverted`

This is intentionally visible so optimistic work is not hidden inside component state.

### Simulate And Resolve A Conflict

1. Select the target cell in Table.
2. Use the Conflict button or the command-palette conflict command.
3. Inspect the local and remote values in the Conflicts section.
4. Choose Local to keep the optimistic value, or Remote to apply the collaborator value.

Resolution closes the conflict and persists the resulting workspace state.

## Presence

The presence strip and cursors are deterministic demo data. They show how collaborator identity and cell addresses can be rendered without mixing presence into the persisted workspace document.

## Project Resources

The resource cards at the bottom of the app open:

- [GitHub repository](https://github.com/danielemasone/enterprise-data-workbench)
- [README](https://github.com/danielemasone/enterprise-data-workbench#readme)
- [User guide](https://github.com/danielemasone/enterprise-data-workbench/blob/main/guides/user-guide.md)
- [Generated TypeDoc](https://danielemasone.github.io/enterprise-data-workbench/docs/)
- [Coverage report](https://danielemasone.github.io/enterprise-data-workbench/coverage/)

## Mobile And Accessibility Notes

- Workbench panels stack on smaller screens and the dense table scrolls within its own region.
- View tabs remain available on touch devices; kanban cards also expose a button alternative to drag-and-drop.
- Interactive controls have accessible names and visible focus styles.
- Sync changes and conflict counts are announced through a polite live region.
- Core table, tab, palette and theme workflows are keyboard accessible.
- Reduced-motion preferences are respected by the application's transition styles.

## Suggested Showcase Captures

Useful portfolio captures include:

- Inline edit, pending operation and sync acknowledgement.
- Conflict simulation followed by local or remote resolution.
- Table, kanban and calendar at desktop and mobile widths.
