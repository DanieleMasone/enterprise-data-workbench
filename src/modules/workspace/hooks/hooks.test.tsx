import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useOptimisticMutation } from './useOptimisticMutation';

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

  it('tracks optimistic mutation success and failure state', async () => {
    const successMutation = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ mutation }: { readonly mutation: () => Promise<void> }) => useOptimisticMutation(mutation),
      {
        initialProps: {
          mutation: successMutation,
        },
      },
    );

    await act(async () => {
      await result.current.run();
    });

    expect(successMutation).toHaveBeenCalledTimes(1);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();

    rerender({
      mutation: vi.fn<() => Promise<void>>().mockRejectedValue(new Error('sync exploded')),
    });

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe('sync exploded');
    expect(result.current.isPending).toBe(false);
  });
});
