import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('published user guide', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/guide/');
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
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

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders end-user workflows and stable documentation navigation', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Enterprise Data Workbench User Guide' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'User guide contents' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Table view' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Command Palette' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Conflict simulation and resolution' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Architecture overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API documentation' })).toHaveAttribute(
      'href',
      '/docs/',
    );
    expect(screen.getByRole('link', { name: 'Coverage report' })).toHaveAttribute(
      'href',
      '/coverage/',
    );
    expect(screen.getByRole('link', { name: 'GitHub repository' })).toHaveAttribute(
      'href',
      'https://github.com/danielemasone/enterprise-data-workbench',
    );
    expect(screen.getByRole('link', { name: 'Workbench' })).toHaveAttribute('href', '/');
  });

  it('shares and persists the application theme preference', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    await waitFor(() => {
      expect(container.querySelector('.app-shell')).toHaveAttribute('data-theme', 'dark');
    });
    expect(window.localStorage.getItem('enterprise-data-workbench-theme')).toBe('dark');
  });
});
