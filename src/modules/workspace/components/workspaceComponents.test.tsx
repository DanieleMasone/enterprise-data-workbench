import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { DataGrid } from './DataGrid';
import { KanbanView } from './KanbanView';
import { WorkspaceStoreProvider } from '../state/WorkspaceStoreProvider';
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
        store.getState().records.find((record) => record.id === 'rec-revenue-dashboard')?.cells.owner,
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

    screen.getByTestId('grid-cell-rec-analytics-migration-title').focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    await user.click(screen.getByRole('checkbox', { name: /select revenue cockpit dashboard/i }));
    await user.click(screen.getByRole('button', { name: /sort by estimate/i }));
    await user.click(screen.getByRole('button', { name: /move initiative right/i }));

    expect(store.getState().selection.selectedCell).toEqual({
      recordId: 'rec-revenue-dashboard',
      fieldId: 'status',
    });
    expect(store.getState().selection.selectedRecordIds).toEqual(['rec-revenue-dashboard']);
    expect(store.getState().sort).toEqual({ fieldId: 'estimate', direction: 'asc' });
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

    await user.click(screen.getByRole('button', { name: /move regulatory export workflow to delivery/i }));

    expect(
      store.getState().records.find((record) => record.id === 'rec-compliance-export')?.cells.status,
    ).toBe('Delivery');
  });

  it('filters and executes command palette actions from the keyboard', async () => {
    const user = userEvent.setup();
    const { store } = createTestWorkspaceStore();
    await store.getState().hydrate();
    store.setState({ commandPaletteOpen: true });

    render(
      <WorkspaceStoreProvider store={store}>
        <CommandPalette />
      </WorkspaceStoreProvider>,
    );

    await user.type(screen.getByLabelText('Search commands'), 'calendar{Enter}');

    expect(store.getState().activeView).toBe('calendar');
    expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument();
  });
});
