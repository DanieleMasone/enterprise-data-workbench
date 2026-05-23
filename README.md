# Enterprise Data Workbench

A data-heavy React application inspired by Notion, Airtable and enterprise workflow platforms.

The goal of this project is not to build another CRUD table.  
The goal is to demonstrate advanced frontend architecture for highly interactive, stateful and performance-sensitive applications.

---

## Why this project exists

Modern enterprise frontends are often limited by:

- complex client-side state
- dense data interaction
- slow rendering under heavy datasets
- inconsistent editing workflows
- fragile drag-and-drop behavior
- poor keyboard accessibility
- weak offline and synchronization strategies

This project explores those problems through a realistic data workspace.

---

# Core Features

## Data Grid

- Inline cell editing
- Column resizing
- Column reordering
- Row selection
- Sorting
- Keyboard navigation
- Optimistic edits
- Local persistence

## Multiple Views

- Table view
- Kanban view
- Calendar view

Each view is backed by the same domain model, avoiding duplicated state and view-specific data structures.

## Keyboard-driven UX

Supported interactions include:

- Arrow key cell navigation
- Enter to edit
- Escape to cancel
- Tab / Shift+Tab movement
- Command palette shortcut
- Undo / redo foundation

Keyboard UX is treated as a first-class feature, not as an afterthought.

## Offline-first Mock

The application includes a local-first synchronization model:

- IndexedDB persistence
- Operation queue
- Pending change tracking
- Mock reconciliation
- Simulated conflicts

The sync layer is intentionally visible to show how client-side consistency is handled.

## Collaboration Mock

The project simulates collaborative behavior without requiring a real backend:

- Live cursors
- Remote user presence
- Delayed remote updates
- Conflict indicators
- Optimistic UI behavior

---

# Tech Stack

- React
- TypeScript
- Vite
- TanStack Table
- DnD Kit
- Zustand
- Dexie
- Vitest
- Testing Library

---

# Architecture

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
      state/
        workspace.store.ts
      model/
        record.types.ts
        view.types.ts
      services/
        persistence.service.ts
        sync.service.ts
        reconciliation.service.ts
      hooks/
        useKeyboardShortcuts.ts
        useOptimisticMutation.ts
  shared/
    ui/
    lib/
    types/
```

---

# Design Principles

## Domain-first state

The application state is modeled around workspace records, views and operations rather than around UI components.

## View independence

Table, Kanban and Calendar views share the same underlying data model.

## Optimistic by default

User actions update the UI immediately and are later reconciled through the mock sync layer.

## Performance-aware rendering

The grid architecture is designed to isolate expensive rendering paths and avoid unnecessary full-table updates.

## Explicit interaction model

Keyboard navigation, editing state, drag operations and sync state are modeled explicitly to avoid hidden coupling.

---

# Main Technical Challenges

## State explosion

Data-heavy applications quickly accumulate overlapping state:

- selected cell
- edited cell
- hovered row
- pending operation
- dirty record
- remote update
- conflict state
- drag state

This project handles those concerns through explicit domain stores and isolated interaction state.

## Inline editing

Inline editing is implemented with controlled transitions between read mode, edit mode, commit and rollback.

## Drag and drop

Drag events are converted into domain-level operations instead of mutating UI state directly.

## Offline reconciliation

Local operations are persisted and replayed through a mock synchronization layer.

---

# Running the project

```bash
npm install
npm run dev
```

---

# Testing

```bash
npm run test
```

---

# Roadmap

- [ ] Table view
- [ ] Inline editing
- [ ] Column resize
- [ ] Column reorder
- [ ] Keyboard navigation
- [ ] Kanban view
- [ ] Calendar view
- [ ] Local persistence
- [ ] Optimistic updates
- [ ] Mock reconciliation
- [ ] Collaboration presence
- [ ] Sync inspector
- [ ] Performance profiling notes

---

# What this project demonstrates

This project is designed to show senior frontend capabilities:

- complex UI architecture
- typed domain modeling
- advanced state management
- interaction-heavy UX
- rendering performance awareness
- offline-first thinking
- maintainable modular structure
- enterprise-grade frontend engineering discipline

---

# Suggested Future Improvements

- Real-time collaboration via WebSockets
- CRDT-based synchronization
- Virtualized rendering for large datasets
- Plugin architecture for custom views
- Multi-workspace support
- Role-based permissions
- Backend synchronization service

---

# Status

Work in progress.
