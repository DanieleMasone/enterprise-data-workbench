import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { WorkspaceCommand } from '../../model/view.types';
import { useWorkspaceSelector } from '../../state/WorkspaceStoreProvider';

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

    const timeoutId = window.setTimeout(() => {
      setQuery('');
      setActiveIndex(0);
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  if (!open) {
    return null;
  }

  const executeCommand = (command: WorkspaceCommand): void => {
    void command.execute();
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

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

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
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
