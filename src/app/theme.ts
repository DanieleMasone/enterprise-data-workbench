import { useCallback, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'enterprise-data-workbench-theme';

/** Shares the persisted portfolio theme between the workbench and the user guide. */
export function usePersistedTheme(): readonly [ThemeMode, (theme: ThemeMode) => void] {
  const [theme, setThemeState] = useState<ThemeMode>(resolveInitialTheme);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
  }, []);

  return [theme, setTheme];
}

function resolveInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
