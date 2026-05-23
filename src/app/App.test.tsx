import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceStoreProvider } from '../modules/workspace/state';
import { createTestWorkspaceStore } from '../modules/workspace/test/createTestStore';
import { WorkspaceApplication } from './App';

describe('workspace application shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    expect(screen.getByLabelText('Sync inspector')).toBeInTheDocument();
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
});
