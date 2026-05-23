import { createContext, type ReactNode, useContext } from 'react';
import { useStore } from 'zustand';
import type { WorkspaceStore } from '../model/workspace.types';
import { useWorkspaceStore, type WorkspaceStoreHook } from './workspace.store';

const WorkspaceStoreContext = createContext<WorkspaceStoreHook | null>(null);

/** Props for injecting a workspace store into a React subtree. */
export interface WorkspaceStoreProviderProps {
  readonly children: ReactNode;
  readonly store?: WorkspaceStoreHook;
}

/** Provides an injectable workspace store so UI tests can use isolated state. */
export function WorkspaceStoreProvider({ children, store = useWorkspaceStore }: WorkspaceStoreProviderProps) {
  return <WorkspaceStoreContext.Provider value={store}>{children}</WorkspaceStoreContext.Provider>;
}

/** Selects workspace state or commands from the current provider-bound store. */
export function useWorkspaceSelector<T>(selector: (store: WorkspaceStore) => T): T {
  const store = useContext(WorkspaceStoreContext);
  if (!store) {
    throw new Error('WorkspaceStoreProvider is required before using workspace state.');
  }

  return useStore(store, selector);
}
