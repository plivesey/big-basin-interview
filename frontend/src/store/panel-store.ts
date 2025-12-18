import { create } from 'zustand';
import type { DisplayProvider } from '@asba/shared-types';

// Re-export for consumers
export type { DisplayProvider } from '@asba/shared-types';

// Panel store state
export interface PanelState {
  // Provider panel state
  isProviderPanelOpen: boolean;
  displayedProviders: DisplayProvider[];
  activeWorkflowId: string | null;

  // Actions
  openProviderPanel: (providers: DisplayProvider[], workflowId?: string) => void;
  closeProviderPanel: () => void;
  updateProviders: (providers: DisplayProvider[]) => void;
  setActiveWorkflowId: (workflowId: string | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isProviderPanelOpen: false,
  displayedProviders: [] as DisplayProvider[],
  activeWorkflowId: null as string | null,
};

// Create the store
export const usePanelStore = create<PanelState>((set) => ({
  ...initialState,

  openProviderPanel: (providers: DisplayProvider[], workflowId?: string) =>
    set({
      isProviderPanelOpen: true,
      displayedProviders: providers,
      activeWorkflowId: workflowId ?? null,
    }),

  closeProviderPanel: () =>
    set({
      isProviderPanelOpen: false,
      displayedProviders: [],
    }),

  updateProviders: (providers: DisplayProvider[]) =>
    set({
      displayedProviders: providers,
      isProviderPanelOpen: providers.length > 0,
    }),

  setActiveWorkflowId: (workflowId: string | null) =>
    set({
      activeWorkflowId: workflowId,
    }),

  reset: () => set(initialState),
}));
