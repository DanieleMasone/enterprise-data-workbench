import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceStoreProvider } from '../modules/workspace/state';
import { createTestWorkspaceStore } from '../modules/workspace/test/createTestStore';
import { WorkspaceApplication } from './App';

describe('workspace application shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it('renders the portfolio showcase, architecture diagram and workspace after hydration', async () => {
    const { store } = createTestWorkspaceStore();

    render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    expect(await screen.findByRole('heading', { name: /enterprise data workbench/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /runtime architecture/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /data-heavy workbench/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github: source repository/i })).toHaveAttribute(
      'href',
      'https://github.com/danielemasone/enterprise-data-workbench',
    );
    expect(screen.getByRole('link', { name: /typedoc: generated api docs/i })).toHaveAttribute(
      'href',
      '/docs/',
    );
    expect(screen.getByRole('link', { name: /coverage: generated test report/i })).toHaveAttribute(
      'href',
      '/coverage/',
    );
    expect(screen.getByLabelText('Sync inspector')).toBeInTheDocument();
  });

  it('switches Table, Kanban and Calendar as accessible workbench tabs', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();

    render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    await screen.findByRole('heading', { name: /enterprise data workbench/i });
    const tableTab = screen.getByRole('tab', { name: 'Table' });
    const kanbanTab = screen.getByRole('tab', { name: 'Kanban' });
    const calendarTab = screen.getByRole('tab', { name: 'Calendar' });

    expect(tableTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Table' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();

    await user.click(kanbanTab);

    expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Kanban' })).toBeInTheDocument();
    expect(screen.getByLabelText('Kanban view')).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();

    await user.click(calendarTab);

    expect(calendarTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Calendar view')).toBeInTheDocument();
  });

  it('supports keyboard activation across workbench tabs', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();

    render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    await screen.findByRole('heading', { name: /enterprise data workbench/i });
    const tableTab = screen.getByRole('tab', { name: 'Table' });
    const kanbanTab = screen.getByRole('tab', { name: 'Kanban' });
    const calendarTab = screen.getByRole('tab', { name: 'Calendar' });

    tableTab.focus();
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(kanbanTab).toHaveFocus();

    await user.keyboard('{End}');

    await waitFor(() => {
      expect(calendarTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(calendarTab).toHaveFocus();
  });

  it('respects the system dark preference before the user chooses a theme', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const { store } = createTestWorkspaceStore();

    const { container } = render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    await screen.findByRole('heading', { name: /enterprise data workbench/i });

    expect(container.querySelector('.app-shell')).toHaveAttribute('data-theme', 'dark');
  });

  it('persists the dark mode preference from the header toggle', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();

    const { container } = render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    await screen.findByRole('heading', { name: /enterprise data workbench/i });
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    await waitFor(() => {
      expect(container.querySelector('.app-shell')).toHaveAttribute('data-theme', 'dark');
    });
    expect(window.localStorage.getItem('enterprise-data-workbench-theme')).toBe('dark');
  });

  it('announces command palette expanded state from the trigger', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();

    render(
      <WorkspaceStoreProvider store={store}>
        <WorkspaceApplication />
      </WorkspaceStoreProvider>,
    );

    await screen.findByRole('heading', { name: /enterprise data workbench/i });
    const trigger = screen.getByRole('button', { name: /open command palette/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: /command palette/i })).toHaveAttribute(
      'id',
      'workspace-command-palette',
    );
  });
});
