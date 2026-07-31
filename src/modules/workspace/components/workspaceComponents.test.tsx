import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { DataGrid } from './DataGrid';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { SyncInspector } from './SyncInspector';
import { WorkspaceStoreProvider } from '../state';
import { createTestWorkspaceStore } from '../test/createTestStore';

describe('workspace components', () => {
  it('commits inline grid edits through the domain store', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <WorkspaceStoreProvider store={store}>
        <DataGrid />
      </WorkspaceStoreProvider>,
    );

    await user.dblClick(screen.getByTestId('grid-cell-rec-revenue-dashboard-owner'));
    const editor = screen.getByLabelText('Edit cell');
    fireEvent.change(editor, { target: { value: 'Alex' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => {
      expect(
        store.getState().records.find((record) => record.id === 'rec-revenue-dashboard')?.cells
          .owner,
      ).toBe('Alex');
    });
    expect(store.getState().operationLog.at(-1)?.type).toBe('cell.update');
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('cancels inline grid edits with Escape', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <WorkspaceStoreProvider store={store}>
        <DataGrid />
      </WorkspaceStoreProvider>,
    );

    await user.dblClick(screen.getByTestId('grid-cell-rec-pricing-rules-title'));
    const editor = screen.getByLabelText('Edit cell');
    fireEvent.change(editor, { target: { value: 'Temporary title' } });
    fireEvent.keyDown(editor, { key: 'Escape' });

    expect(
      store.getState().records.find((record) => record.id === 'rec-pricing-rules')?.cells.title,
    ).toBe('Pricing rules review');
  });

  it('supports grid keyboard navigation, row selection, sorting, and column reordering', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <WorkspaceStoreProvider store={store}>
        <DataGrid />
      </WorkspaceStoreProvider>,
    );

    expect(
      screen.getByRole('button', { name: /initiative is already the first column/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /estimate is already the last column/i }),
    ).toBeDisabled();

    screen.getByTestId('grid-cell-rec-analytics-migration-title').focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    await user.click(screen.getByRole('checkbox', { name: /select revenue cockpit dashboard/i }));
    const estimateSortButton = screen.getByRole('button', { name: /sort by estimate/i });
    await user.click(estimateSortButton);

    const initialTitleWidth = store.getState().fields.find((field) => field.id === 'title')?.width;
    screen.getByRole('button', { name: /resize initiative with arrow keys/i }).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: /move initiative right/i }));

    expect(store.getState().selection.selectedCell).toEqual({
      recordId: 'rec-revenue-dashboard',
      fieldId: 'status',
    });
    expect(store.getState().selection.selectedRecordIds).toEqual(['rec-revenue-dashboard']);
    expect(store.getState().sort).toEqual({ fieldId: 'estimate', direction: 'asc' });
    expect(estimateSortButton.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(store.getState().fields.find((field) => field.id === 'title')?.width).toBe(
      (initialTitleWidth ?? 0) + 16,
    );
    expect(store.getState().fieldOrder.slice(0, 2)).toEqual(['status', 'title']);
  });

  it('moves records from the kanban view through shared status operations', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <WorkspaceStoreProvider store={store}>
        <KanbanView />
      </WorkspaceStoreProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /move regulatory export workflow to delivery/i }),
    );

    expect(
      store.getState().records.find((record) => record.id === 'rec-compliance-export')?.cells
        .status,
    ).toBe('Delivery');
  });

  it('filters and executes command palette actions from the keyboard', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <>
        <button type="button">Palette trigger</button>
        <WorkspaceStoreProvider store={store}>
          <CommandPalette />
        </WorkspaceStoreProvider>
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'Palette trigger' });
    trigger.focus();
    act(() => store.getState().setCommandPaletteOpen(true));

    const search = screen.getByLabelText('Search commands');
    await waitFor(() => expect(search).toHaveFocus());
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(
      screen.getByRole('option', { name: 'Simulate conflict on selected cell' }),
    ).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(search).toHaveFocus();
    await user.type(search, 'calendar{Enter}');

    expect(store.getState().activeView).toBe('calendar');
    expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders calendar projections from shared due dates', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();

    render(
      <WorkspaceStoreProvider store={store}>
        <CalendarView />
      </WorkspaceStoreProvider>,
    );

    expect(screen.getByRole('region', { name: '2026-06-02' })).toBeInTheDocument();
    expect(screen.getByText('Analytics warehouse migration')).toBeInTheDocument();
  });

  it('shows an empty grid state when the shared document has no records', async () => {
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    store.setState({ records: [] });

    render(
      <WorkspaceStoreProvider store={store}>
        <DataGrid />
      </WorkspaceStoreProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('No records available');
  });

  it('shows sync inspector operation history and resolves a simulated conflict', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    await store.getState().updateCell('rec-analytics-migration', 'owner', 'Rae');
    store.getState().simulateRemoteConflict('rec-analytics-migration', 'owner', 'Remote owner');

    render(
      <WorkspaceStoreProvider store={store}>
        <SyncInspector />
      </WorkspaceStoreProvider>,
    );

    expect(screen.getByLabelText('Operation log')).toHaveTextContent('cell.update');
    expect(screen.getByLabelText('Conflicts')).toHaveTextContent('Remote owner');

    await user.click(screen.getByRole('button', { name: 'Remote' }));

    expect(
      store.getState().records.find((record) => record.id === 'rec-analytics-migration')?.cells
        .owner,
    ).toBe('Remote owner');
  });
});
