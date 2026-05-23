import { useEffect } from 'react';

/** Options for registering workspace-wide keyboard shortcuts. */
export interface KeyboardShortcutOptions {
  readonly enabled?: boolean;
  readonly onCommandPalette: () => void;
  readonly onSync?: () => void;
}

/** Registers global workspace shortcuts while leaving focused editors in control of text input. */
export function useKeyboardShortcuts({
  enabled = true,
  onCommandPalette,
  onSync,
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      const isModifierShortcut = event.metaKey || event.ctrlKey;
      if (!isModifierShortcut) {
        return;
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onCommandPalette();
      }

      if (event.key.toLowerCase() === 's' && onSync) {
        event.preventDefault();
        onSync();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onCommandPalette, onSync]);
}
