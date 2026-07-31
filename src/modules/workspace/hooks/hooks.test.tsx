import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('workspace hooks', () => {
  it('routes global command and sync shortcuts when enabled', () => {
    const onCommandPalette = vi.fn();
    const onSync = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        onCommandPalette,
        onSync,
      }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
    });

    expect(onCommandPalette).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts when disabled or when no modifier key is pressed', () => {
    const onCommandPalette = vi.fn();
    const onSync = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        onCommandPalette,
        onSync,
      }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });

    expect(onCommandPalette).not.toHaveBeenCalled();
    expect(onSync).not.toHaveBeenCalled();
  });
});
