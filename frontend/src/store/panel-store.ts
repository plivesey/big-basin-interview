import { create } from 'zustand';
import type { DisplayProvider } from '@asba/shared-types';

// Re-export for consumers
export type { DisplayProvider } from '@asba/shared-types';

// Panel store state
export interface PanelState {
  // Provider panel state
  isProviderPanelOpen: boolean;
  displayedProviders: DisplayProvider[];

  // Actions
  openProviderPanel: (providers: DisplayProvider[]) => void;
  closeProviderPanel: () => void;
  updateProviders: (providers: DisplayProvider[]) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isProviderPanelOpen: false,
  displayedProviders: [],
};

// Create the store
export const usePanelStore = create<PanelState>((set) => ({
  ...initialState,

  openProviderPanel: (providers: DisplayProvider[]) =>
    set({
      isProviderPanelOpen: true,
      displayedProviders: providers,
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

  reset: () => set(initialState),
}));
