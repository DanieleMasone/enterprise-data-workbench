import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { WorkspaceCommand } from '../../model';
import { useWorkspaceSelector } from '../../state';

/** Keyboard-first command palette for view switching, sync, and demo reconciliation actions. */
export function CommandPalette() {
  const open = useWorkspaceSelector((store) => store.commandPaletteOpen);
  const selection = useWorkspaceSelector((store) => store.selection);
  const setOpen = useWorkspaceSelector((store) => store.setCommandPaletteOpen);
  const setActiveView = useWorkspaceSelector((store) => store.setActiveView);
  const flushSync = useWorkspaceSelector((store) => store.flushSync);
  const simulateRemoteConflict = useWorkspaceSelector((store) => store.simulateRemoteConflict);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const commands = useMemo<WorkspaceCommand[]>(
    () => [
      {
        id: 'view-table',
        label: 'Open table view',
        keywords: ['grid', 'records', 'spreadsheet'],
        execute: () => setActiveView('table'),
      },
      {
        id: 'view-kanban',
        label: 'Open kanban view',
        keywords: ['board', 'status', 'drag'],
        execute: () => setActiveView('kanban'),
      },
      {
        id: 'view-calendar',
        label: 'Open calendar view',
        keywords: ['date', 'schedule', 'due'],
        execute: () => setActiveView('calendar'),
      },
      {
        id: 'sync-now',
        label: 'Sync pending operations',
        keywords: ['save', 'reconcile', 'server'],
        execute: flushSync,
      },
      {
        id: 'simulate-conflict',
        label: 'Simulate conflict on selected cell',
        keywords: ['remote', 'presence', 'collision'],
        execute: () =>
          simulateRemoteConflict(
            selection.selectedCell.recordId,
            selection.selectedCell.fieldId,
            'Remote collaborator value',
          ),
      },
    ],
    [flushSync, selection.selectedCell, setActiveView, simulateRemoteConflict],
  );

  const visibleCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter((command) =>
      [command.label, ...command.keywords].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timeoutId = window.setTimeout(() => {
      setQuery('');
      setActiveIndex(0);
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const executeCommand = (command: WorkspaceCommand): void => {
    void command.execute();
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleCommands.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const command = visibleCommands[activeIndex];
      if (command) {
        executeCommand(command);
      }
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }

    const focusableElements = [...dialogRef.current.querySelectorAll<HTMLElement>('input, button')];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onMouseDown={() => setOpen(false)}
    >
      <section
        ref={dialogRef}
        id="workspace-command-palette"
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-palette-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
            placeholder="Search commands"
          />
        </div>
        <div className="command-palette-list" role="listbox" aria-label="Commands">
          {visibleCommands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : ''}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => executeCommand(command)}
            >
              {command.label}
            </button>
          ))}
          {visibleCommands.length === 0 ? <p>No commands found</p> : null}
        </div>
      </section>
    </div>
  );
}
